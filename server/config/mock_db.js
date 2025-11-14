// Plik: server/config/mock_db.js
// Prosty system mockowania bazy danych w pamięci.

console.log('Ładowanie mockowanej bazy danych...');

const users = [];
let userIdCounter = 1;

// Mock modelu User
const User = {
  findOne: async ({ email }) => {
    console.log(`[MockDB] Szukanie użytkownika z emailem: ${email}`);
    const user = users.find(u => u.email === email);
    return user ? { ...user } : null;
  },

  findById: async (id) => {
    console.log(`[MockDB] Szukanie użytkownika z ID: ${id}`);
    const user = users.find(u => u.id === id);
    // Symulujemy metodę .select('-password'), zwracając obiekt bez hasła
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, select: () => userWithoutPassword };
    }
    return null;
  },
};

// Mock konstruktora modelu, który tworzy instancje z metodą `save`
function UserModel(data) {
  this.email = data.email;
  this.password = data.password;
  this.is_profile_complete = false;

  // Symulacja zapisu (dodanie do tablicy users)
  this.save = async () => {
    console.log(`[MockDB] Zapisywanie nowego użytkownika: ${this.email}`);
    const newUser = {
      ...this,
      id: userIdCounter++,
      createdAt: new Date(),
    };
    users.push(newUser);
    // Zwracamy obiekt, który ma pole 'id' (ważne dla JWT)
    return { id: newUser.id };
  };
}

// Funkcja "łącząca" z fałszywą bazą danych
const connectDB = async () => {
  console.log('✅ Połączono z mockowaną bazą danych w pamięci.');
  return Promise.resolve();
};

module.exports = { connectDB, User, UserModel, users };
