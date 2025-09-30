import { performFullDataMigration } from './fullDataMigration';

console.log('🚀 Starting immediate data migration...');

// Execute migration immediately
performFullDataMigration()
  .then(result => {
    if (result.success) {
      console.log('✅ Migration completed successfully!', {
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
      console.error('❌ Migration failed with errors:', result.errors);
    }
  })
  .catch(error => {
    console.error('💥 Fatal migration error:', error);
  });

export {};