package com.futbol.client.player.repository;

import com.futbol.client.player.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByUserId(String userId);
    List<Player> findByNameContainingIgnoreCase(String name);
    List<Player> findByTeamIgnoreCase(String team);

    @Query(value = "SELECT * FROM players ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Player> findRandomPlayers(@Param("limit") int limit);
}
