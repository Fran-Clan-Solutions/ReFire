package com.ReFire.WebService;

import java.time.Instant;
import java.util.List;

import com.ReFire.WebService.model.PendingRecipe;
import com.ReFire.WebService.model.Recipe;
import com.ReFire.WebService.repository.PendingRecipeRepository;
import com.ReFire.WebService.repository.RecipeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SubmissionController
{
    @Autowired
    private PendingRecipeRepository pendingRecipeRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    // Shared secret gating the /admin/** endpoints. Set a real value via the
    // ADMIN_KEY environment variable in production - "changeme" is only a
    // local-dev fallback and must not be relied on anywhere it's reachable.
    @Value("${app.admin-key}")
    private String adminKey;

    // ---- Public: submit a new recipe for review ----
    @PostMapping("/submitRecipe")
    public ResponseEntity<?> submitRecipe(@RequestBody Recipe submission)
    {
        String validationError = validateSubmission(submission);
        if (validationError != null)
        {
            return ResponseEntity.badRequest().body(validationError);
        }

        PendingRecipe pending = new PendingRecipe(
                submission.getName().trim(),
                submission.getMealType(),
                submission.getCookTime(),
                submission.getIngredients(),
                submission.getInstructions().trim(),
                Instant.now()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(pendingRecipeRepository.save(pending));
    }

    // ---- Admin: list pending submissions, oldest first ----
    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPending(@RequestHeader(value = "X-Admin-Key", required = false) String key)
    {
        if (!isAuthorized(key))
        {
            return unauthorized();
        }

        List<PendingRecipe> pending = pendingRecipeRepository.findAll();
        pending.sort((a, b) -> a.getSubmittedAt().compareTo(b.getSubmittedAt()));
        return ResponseEntity.ok(pending);
    }

    // ---- Admin: approve a submission. The request body carries the final
    // recipe data, since the admin may have edited the name (or anything
    // else) to resolve a naming clash before approving. ----
    @PostMapping("/admin/approve/{id}")
    public ResponseEntity<?> approve(
            @PathVariable String id,
            @RequestBody Recipe finalRecipe,
            @RequestHeader(value = "X-Admin-Key", required = false) String key)
    {
        if (!isAuthorized(key))
        {
            return unauthorized();
        }

        if (!pendingRecipeRepository.existsById(id))
        {
            return ResponseEntity.notFound().build();
        }

        String validationError = validateSubmission(finalRecipe);
        if (validationError != null)
        {
            return ResponseEntity.badRequest().body(validationError);
        }

        Recipe newRecipe = new Recipe(
                finalRecipe.getName().trim(),
                finalRecipe.getMealType(),
                finalRecipe.getCookTime(),
                finalRecipe.getIngredients(),
                finalRecipe.getInstructions().trim()
        );

        Recipe saved = recipeRepository.save(newRecipe);
        pendingRecipeRepository.deleteById(id);

        return ResponseEntity.ok(saved);
    }

    // ---- Admin: reject (discard) a submission ----
    @DeleteMapping("/admin/reject/{id}")
    public ResponseEntity<?> reject(
            @PathVariable String id,
            @RequestHeader(value = "X-Admin-Key", required = false) String key)
    {
        if (!isAuthorized(key))
        {
            return unauthorized();
        }

        if (!pendingRecipeRepository.existsById(id))
        {
            return ResponseEntity.notFound().build();
        }

        pendingRecipeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validateSubmission(Recipe submission)
    {
        if (submission == null)
        {
            return "Recipe data is required.";
        }
        if (submission.getName() == null || submission.getName().isBlank())
        {
            return "Recipe name is required.";
        }
        if (submission.getMealType() == null)
        {
            return "Meal type is required.";
        }
        if (submission.getCookTime() <= 0)
        {
            return "Cook time must be greater than 0.";
        }
        if (submission.getIngredients() == null || submission.getIngredients().isEmpty())
        {
            return "At least one ingredient is required.";
        }
        if (submission.getInstructions() == null || submission.getInstructions().isBlank())
        {
            return "Instructions are required.";
        }
        return null;
    }

    private boolean isAuthorized(String key)
    {
        return adminKey != null && !adminKey.isBlank() && adminKey.equals(key);
    }

    private ResponseEntity<?> unauthorized()
    {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing admin key.");
    }
}