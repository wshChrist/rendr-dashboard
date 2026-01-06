/**
 * Script pour définir un utilisateur comme administrateur
 *
 * Usage: node scripts/set-admin.js <email>
 *
 * Exemple: node scripts/set-admin.js user@example.com
 */

const email = process.argv[2];

if (!email) {
  console.error('❌ Erreur: Veuillez fournir un email');
  console.log('\nUsage: node scripts/set-admin.js <email>');
  console.log('Exemple: node scripts/set-admin.js user@example.com');
  process.exit(1);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function setAdmin() {
  try {
    console.log(`🔄 Définition du rôle admin pour: ${email}...`);

    const response = await fetch(`${API_URL}/api/admin/set-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur:', data.error || data.message);
      process.exit(1);
    }

    console.log('✅ Succès!');
    console.log(`   - Email: ${data.email}`);
    console.log(`   - User ID: ${data.userId}`);
    console.log(`   - Rôle: ${data.role}`);
    console.log(
      '\n📝 Note: Vous devez vous déconnecter et reconnecter pour que les changements prennent effet.'
    );
  } catch (error) {
    console.error('❌ Erreur lors de la requête:', error.message);
    process.exit(1);
  }
}

setAdmin();
