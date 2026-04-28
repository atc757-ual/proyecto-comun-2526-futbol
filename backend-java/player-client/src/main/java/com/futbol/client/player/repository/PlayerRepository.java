package com.futbol.client.player.repository;

import com.futbol.client.player.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByUserId(String userId);
    List<Player> findByNameContainingIgnoreCase(String name);
    List<Player> findByTeamIgnoreCase(String team);
}
