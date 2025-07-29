// Script para probar las APIs directamente sin interceptores

// Función para hacer peticiones sin axios
async function testDirectAPI() {
    const baseURL = 'http://localhost:3001/api';
    
    console.log('=== Testing Direct API Calls ===');
    
    try {
        // Test Plans
        console.log('\n1. Testing Plans...');
        const plansResponse = await fetch(`${baseURL}/dropdown/plans`);
        console.log('Plans Status:', plansResponse.status);
        console.log('Plans Headers:', Object.fromEntries(plansResponse.headers.entries()));
        
        if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            console.log('Plans Data:', plansData);
            console.log('Plans Count:', plansData.length);
        } else {
            console.error('Plans Error:', await plansResponse.text());
        }
        
        // Test Levels
        console.log('\n2. Testing Levels...');
        const levelsResponse = await fetch(`${baseURL}/dropdown/levels`);
        console.log('Levels Status:', levelsResponse.status);
        console.log('Levels Headers:', Object.fromEntries(levelsResponse.headers.entries()));
        
        if (levelsResponse.ok) {
            const levelsData = await levelsResponse.json();
            console.log('Levels Data:', levelsData);
            console.log('Levels Count:', levelsData.length);
        } else {
            console.error('Levels Error:', await levelsResponse.text());
        }
        
        // Test Teachers (for comparison)
        console.log('\n3. Testing Teachers (for comparison)...');
        const teachersResponse = await fetch(`${baseURL}/dropdown/teachers`);
        console.log('Teachers Status:', teachersResponse.status);
        
        if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            console.log('Teachers Data:', teachersData);
            console.log('Teachers Count:', teachersData.length);
        } else {
            console.error('Teachers Error:', await teachersResponse.text());
        }
        
        // Test Subjects (for comparison)
        console.log('\n4. Testing Subjects (for comparison)...');
        const subjectsResponse = await fetch(`${baseURL}/dropdown/subjects`);
        console.log('Subjects Status:', subjectsResponse.status);
        
        if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json();
            console.log('Subjects Data:', subjectsData);
            console.log('Subjects Count:', subjectsData.length);
        } else {
            console.error('Subjects Error:', await subjectsResponse.text());
        }
        
    } catch (error) {
        console.error('Network Error:', error);
    }
}

// Ejecutar el test
testDirectAPI();