/**
 * Database Migration for Webhook Queue
 * Creates webhook_queue table with proper indexes
 */

export const up = async (knex) => {
  // Create webhook_queue table
  await knex.schema.createTable('webhook_queue', (table) => {
    table.increments('id').primary();
    table.uuid('attempt_id').notNullable().references('id').inTable('transfer_attempts');
    table.string('url').notNullable();
    table.string('event').notNullable();
    table.text('payload').notNullable();
    table.json('response').nullable();
    table.enum('status', ['pending', 'retrying', 'delivered', 'failed']).defaultTo('pending');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('next_retry').nullable();
    table.text('last_error').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    table.timestamp('failed_at').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).onUpdate(knex.fn.now());

    // Indexes for efficient querying
    table.index(['attempt_id']);
    table.index(['status']);
    table.index(['next_retry']);
    table.index(['status', 'next_retry']);
    table.index(['created_at']);
  });

  console.log('✓ Created webhook_queue table');
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists('webhook_queue');
  console.log('✓ Dropped webhook_queue table');
};
