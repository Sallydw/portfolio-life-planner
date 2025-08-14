import { dbHelpers } from './db';

// Test function to verify seeding works
export async function testSeedDatabase(): Promise<void> {
  try {
    console.log('Testing database seeding...');
    
    // Seed the database
    await dbHelpers.seed();
    
    // Verify that life areas were created
    const lifeAreas = await dbHelpers.lifeAreas.getAll();
    console.log(`✅ Successfully seeded ${lifeAreas.length} life areas:`);
    
    lifeAreas.forEach(area => {
      console.log(`  - ${area.name} (${area.color}) - Order: ${area.order}`);
    });
    
    // Verify we have exactly 5 life areas (as per spec)
    if (lifeAreas.length === 5) {
      console.log('✅ Database seeding completed successfully!');
    } else {
      console.log(`❌ Expected 5 life areas, got ${lifeAreas.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing database seeding:', error);
  }
}

// Export for use in development
export default testSeedDatabase;
