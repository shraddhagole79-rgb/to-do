package com.todoapp.repository;

import com.todoapp.model.Todo;
import com.todoapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // Fetch all todos belonging to a user, ordered newest first
    List<Todo> findByUserOrderByIdDesc(User user);

    // Fetch a single todo ensuring it belongs to the authenticated user
    Optional<Todo> findByIdAndUser(Long id, User user);

    // Delete all completed todos belonging to a specific user
    @Transactional
    @Modifying
    @Query("DELETE FROM Todo t WHERE t.user = :user AND t.done = true")
    void deleteByUserAndDoneTrue(@Param("user") User user);
}
