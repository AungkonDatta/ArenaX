import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityMetadata,
  EntitySubscriberInterface,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { RequestContext } from '../common/context/request-context';
import { AuditLog } from './entities/audit-log.entity';

const HIDDEN_FIELDS = ['passwordHash'];

@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<ObjectLiteral>) {
    return this.record(event.manager, 'CREATE', event.metadata, null, event.entity);
  }

  afterUpdate(event: UpdateEvent<ObjectLiteral>) {
    if (!event.entity) {
      return;
    }
    return this.record(event.manager, 'UPDATE', event.metadata, event.databaseEntity, event.entity);
  }

  afterRemove(event: RemoveEvent<ObjectLiteral>) {
    return this.record(
      event.manager,
      'DELETE',
      event.metadata,
      event.databaseEntity ?? event.entity,
      null,
      event.entityId,
    );
  }

  private async record(
    manager: EntityManager,
    action: string,
    metadata: EntityMetadata,
    oldEntity: ObjectLiteral | null,
    newEntity: ObjectLiteral | null,
    removedId?: unknown,
  ) {
    if (metadata.target === AuditLog) {
      return;
    }
    const context = RequestContext.get();
    await manager.getRepository(AuditLog).insert({
      userId: context?.userId ?? null,
      action,
      entity: metadata.tableName,
      entityId: this.entityId(metadata, newEntity ?? oldEntity, removedId),
      oldValue: this.snapshot(metadata, oldEntity),
      newValue: this.snapshot(metadata, newEntity),
      ipAddress: context?.ip ?? null,
    });
  }

  private snapshot(metadata: EntityMetadata, entity: ObjectLiteral | null) {
    if (!entity) {
      return null;
    }
    const values: Record<string, unknown> = {};
    for (const column of metadata.columns) {
      if (HIDDEN_FIELDS.includes(column.propertyName)) {
        continue;
      }
      const value = column.getEntityValue(entity);
      if (value !== undefined) {
        values[column.propertyName] = value;
      }
    }
    return values;
  }

  private entityId(metadata: EntityMetadata, entity: ObjectLiteral | null, removedId?: unknown) {
    const ids = removedId ?? (entity ? metadata.getEntityIdMap(entity) : null);
    if (ids === null || ids === undefined) {
      return null;
    }
    if (typeof ids !== 'object') {
      return String(ids);
    }
    const values = Object.values(ids);
    return values.length === 1 ? String(values[0]) : JSON.stringify(ids);
  }
}
