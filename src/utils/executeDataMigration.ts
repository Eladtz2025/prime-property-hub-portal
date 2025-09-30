import { performFullDataMigration } from './fullDataMigration';
import { logger } from './logger';

const log = logger.component('executeDataMigration');

// Execute the migration immediately when this module is imported
export async function executeMigration() {
  try {
    log.info('🚀 Starting automatic data consolidation and migration...');
    
    const result = await performFullDataMigration();
    
    if (result.success) {
      log.info('✅ Migration completed successfully!', {
        propertiesInserted: result.propertiesInserted,
        ownersInserted: result.ownersInserted,
        ownershipLinksCreated: result.ownershipLinksCreated,
        duplicatesRemoved: result.duplicatesRemoved
      });
      
      console.log('🎉 DATA MIGRATION COMPLETE!');
      console.log(`📊 Results:`);
      console.log(`   • ${result.propertiesInserted} properties migrated`);
      console.log(`   • ${result.ownersInserted} owners migrated`);
      console.log(`   • ${result.ownershipLinksCreated} ownership links created`);
      console.log(`   • ${result.duplicatesRemoved} duplicates removed`);
      
    } else {
      log.error('❌ Migration failed with errors:', result.errors);
      console.error('Migration errors:', result.errors);
    }
    
    return result;
  } catch (error) {
    log.error('💥 Fatal migration error:', error);
    console.error('Fatal migration error:', error);
    throw error;
  }
}