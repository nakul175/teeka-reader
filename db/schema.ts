import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const receipts=sqliteTable('receipts',{id:text('id').primaryKey(),customer:text('customer').notNull(),hash:text('hash').notNull(),status:text('status').notNull(),result:text('result'),created:text('created').notNull()});
