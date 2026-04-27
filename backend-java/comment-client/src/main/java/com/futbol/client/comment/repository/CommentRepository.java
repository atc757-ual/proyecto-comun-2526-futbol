package com.futbol.client.comment.repository;

import com.futbol.client.comment.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // Get all comments for a specific player
    List<Comment> findByPlayerId(Long playerId);
    
    // Get all comments from a specific user
    List<Comment> findByUserId(Long userId);
}
