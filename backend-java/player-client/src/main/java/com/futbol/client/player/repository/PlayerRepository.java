package com.futbol.client.player.repository;

import com.futbol.client.player.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByUserId(String userId);
    // Add custom queries here, for example:
    // List<Player> findByTeam(String team);
}
