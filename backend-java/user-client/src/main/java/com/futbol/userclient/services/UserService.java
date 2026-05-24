package com.futbol.userclient.services;

import com.futbol.userclient.models.User;
import com.futbol.userclient.repositories.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Sincroniza usuario de Firebase con BD local.
     * Si existe por firebaseUid: actualiza datos.
     * Si existe por email: vincula firebaseUid y actualiza.
     * Si no existe: crea registro nuevo.
     */
    public User syncUserFromFirebase(String firebaseUid, String email, String name, boolean isAdmin) {
        Optional<User> userOpt = userRepository.findByFirebaseUid(firebaseUid);
        User user;

        if (userOpt.isEmpty()) {
            Optional<User> userByEmailOpt = userRepository.findByEmail(email.toLowerCase());
            
            if (userByEmailOpt.isPresent()) {
                user = userByEmailOpt.get();
                user.setFirebaseUid(firebaseUid);
                user.setName(name != null ? name : user.getName());
                user.setRole(isAdmin ? "admin" : "user");
            } else {
                user = new User();
                user.setFirebaseUid(firebaseUid);
                user.setEmail(email.toLowerCase());
                user.setName(name != null ? name : email.split("@")[0]);
                user.setRole(isAdmin ? "admin" : "user");
            }
        } else {
            user = userOpt.get();
            user.setName(name != null ? name : user.getName());
            user.setRole(isAdmin ? "admin" : "user");
        }

        return userRepository.save(user);
    }

    public Optional<User> findByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase());
    }

    public List<User> searchUsersByEmail(String email) {
        return userRepository.findTop10ByEmailContainingIgnoreCase(email.toLowerCase());
    }

    public void makeAdmin(String email) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            throw new Exception("Usuario no encontrado");
        }

        User user = userOpt.get();
        user.setRole("admin");
        
        // Sincronizar con Firebase
        try {
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            Map<String, Object> customClaims = new HashMap<>();
            customClaims.put("admin", true);
            FirebaseAuth.getInstance().setCustomUserClaims(userFirebase.getUid(), customClaims);
        } catch (Exception e) {
            logger.warn("Error sincronizando admin claim con Firebase para {}: {}", email, e.getMessage());
        }

        userRepository.save(user);
    }

    public void removeAdmin(String email) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            throw new Exception("Usuario no encontrado");
        }

        User user = userOpt.get();
        user.setRole("user");
        
        // Sincronizar con Firebase
        try {
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            Map<String, Object> customClaims = new HashMap<>();
            customClaims.put("admin", false);
            FirebaseAuth.getInstance().setCustomUserClaims(userFirebase.getUid(), customClaims);
        } catch (Exception e) {
            logger.warn("Error removiendo admin claim en Firebase para {}: {}", email, e.getMessage());
        }

        userRepository.save(user);
    }

    public void toggleUserStatus(String email, boolean disabled) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            throw new Exception("Usuario no encontrado");
        }

        User user = userOpt.get();
        user.setActive(!disabled);
        
        // Sincronizar con Firebase
        try {
            UserRecord userFirebase = FirebaseAuth.getInstance().getUserByEmail(email);
            UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userFirebase.getUid())
                    .setDisabled(disabled);
            FirebaseAuth.getInstance().updateUser(request);
        } catch (Exception e) {
            logger.warn("Error actualizando estado en Firebase para {}: {}", email, e.getMessage());
        }

        userRepository.save(user);
    }
}
