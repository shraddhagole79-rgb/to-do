package com.todoapp.controller;

import com.todoapp.model.Todo;
import com.todoapp.model.User;
import com.todoapp.repository.TodoRepository;
import com.todoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Todo CRUD operations.
 * All endpoints operate within the scope of the currently authenticated user.
 */
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    public TodoController(TodoRepository todoRepository, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
    }

    /**
     * Helper to retrieve the User entity corresponding to the current authenticated username.
     */
    private User getAuthenticatedUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
    }

    /**
     * DTO for creating or updating a todo.
     */
    public static class TodoRequest {
        private String text;
        private Boolean done;
        private String priority;
        private String dueDate;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public Boolean getDone() { return done; }
        public void setDone(Boolean done) { this.done = done; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    }

    @GetMapping
    public List<Todo> getTodos(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return todoRepository.findByUserOrderByIdDesc(user);
    }

    @PostMapping
    public ResponseEntity<?> createTodo(@RequestBody TodoRequest request, Authentication authentication) {
        if (request.getText() == null || request.getText().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Task text cannot be empty"));
        }

        User user = getAuthenticatedUser(authentication);
        Todo todo = new Todo(
                request.getText().trim(),
                request.getPriority() != null ? request.getPriority() : "medium",
                request.getDueDate(),
                user
        );
        if (request.getDone() != null) {
            todo.setDone(request.getDone());
        }

        Todo saved = todoRepository.save(todo);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTodo(
            @PathVariable Long id,
            @RequestBody TodoRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        return todoRepository.findByIdAndUser(id, user)
                .map(todo -> {
                    if (request.getText() != null && !request.getText().trim().isEmpty()) {
                        todo.setText(request.getText().trim());
                    }
                    if (request.getDone() != null) {
                        todo.setDone(request.getDone());
                    }
                    if (request.getPriority() != null) {
                        todo.setPriority(request.getPriority());
                    }
                    if (request.getDueDate() != null) {
                        todo.setDueDate(request.getDueDate().isEmpty() ? null : request.getDueDate());
                    }
                    Todo updated = todoRepository.save(todo);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTodo(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return todoRepository.findByIdAndUser(id, user)
                .map(todo -> {
                    todoRepository.delete(todo);
                    return ResponseEntity.ok(Map.of("message", "Todo deleted"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/completed")
    public ResponseEntity<?> clearCompleted(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        todoRepository.deleteByUserAndDoneTrue(user);
        return ResponseEntity.ok(Map.of("message", "Completed tasks cleared"));
    }
}
