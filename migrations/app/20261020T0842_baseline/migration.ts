#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/30d24f3c45b94e8061ac2c88670c3fdd3e2a914f3f8c3ebdcc7c3b1a9e0ec2f2/contract';
import endContract from '../../snapshots/30d24f3c45b94e8061ac2c88670c3fdd3e2a914f3f8c3ebdcc7c3b1a9e0ec2f2/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({ schema: 'public', typeName: 'Role', members: ['USER', 'ADMIN'] }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Status',
        members: ['NEW', 'IN_PROGRESS', 'DONE'],
      }),
      this.createTable({
        schema: 'public',
        table: 'Category',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Category_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'Ticket',
        columns: [
          col('authorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('categoryId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('room', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"Status"', {
            notNull: true,
            default: lit('NEW'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Status' } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Ticket_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', '"Role"', {
            notNull: true,
            default: lit('USER'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Role' } },
          }),
          col('token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'User_pkey' })],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Category',
        index: 'Category_name_key',
        columns: ['name'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Ticket',
        foreignKey: {
          name: 'Ticket_authorId_fkey',
          columns: ['authorId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Ticket',
        foreignKey: {
          name: 'Ticket_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'Category', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
