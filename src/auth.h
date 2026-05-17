#ifndef AUTH_H
#define AUTH_H

#include <string>

class AuthController {
private:
    std::string tokenSecret;

public:
    AuthController(const std::string& secret);
    virtual ~AuthController();

    bool authenticateUser(const std::string& username, const std::string& password);
    virtual bool validateToken(const std::string& token);
};

#endif // AUTH_H
