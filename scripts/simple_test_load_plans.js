const { loadPlans } = require('./scripts/permissions/load_plans');

console.log('🧪 Iniciando prueba simple de load_plans...');

loadPlans()
    .then(() => {
        console.log('✅ load_plans ejecutado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error ejecutando load_plans:', error.message);
        process.exit(1);
    });