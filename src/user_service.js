class UserService {
  constructor(database) {
    this.db = database;
  }

  async getUser(id) {
    if (!id) {
      throw new Error("User ID is required.");
    }
    const user = await this.db.findUserById(id);
    if (!user) {
      return null;
    }
    return user;
  }

  isUserActive(user) {
    return user && user.status === 'active';
  }
}

function formatUserGreeting(user) {
  if (!user) return "Hello Guest";
  return `Welcome, ${user.name}!`;
}

module.exports = {
  UserService,
  formatUserGreeting
};
