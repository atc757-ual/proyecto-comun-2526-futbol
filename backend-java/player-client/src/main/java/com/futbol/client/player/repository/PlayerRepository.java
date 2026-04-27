package com.futbol.client.player.repository;

import com.futbol.client.player.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    // Add custom queries here, for example:
    // List<Player> findByTeam(String team);
}
