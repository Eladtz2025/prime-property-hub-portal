import { executeMigration } from './executeDataMigration';

// Auto-execute migration on import
console.log('🚀 Initializing data migration...');
executeMigration().catch(console.error);

export {};