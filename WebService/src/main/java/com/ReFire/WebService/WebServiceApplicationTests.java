package com.ReFire.WebService;

import java.time.Instant;
import java.util.List;

import com.ReFire.WebService.model.MealType;
import com.ReFire.WebService.model.PendingRecipe;
import com.ReFire.WebService.repository.PendingRecipeRepository;
import com.ReFire.WebService.repository.RecipeRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WebServiceApplicationTests 
{

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PendingRecipeRepository pendingRecipeRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Value("${app.admin-key}")
    private String adminKey;

    // Marker prefix for anything created by these tests, so cleanup can find
    // and remove it (including leftovers from a test that failed mid-way)
    // without touching real recipe data.
    private static final String TEST_RECIPE_PREFIX = "ZZZ_TEST_";

    @AfterEach
    void cleanupTestRecipes() 
    {
        pendingRecipeRepository.findAll().stream()
                .filter(p -> p.getName() != null && p.getName().startsWith(TEST_RECIPE_PREFIX))
                .forEach(p -> pendingRecipeRepository.deleteById(p.getId()));

        recipeRepository.findAll().stream()
                .filter(r -> r.getName() != null && r.getName().startsWith(TEST_RECIPE_PREFIX))
                .forEach(r -> recipeRepository.deleteById(r.getId()));
    }

    @Test
    void contextLoads() 
    {
        // Just ensures Spring context loads successfully
    }

    // -------------------------
    // /addIngredient tests
    // -------------------------
    @Test
    void testAddIngredientWithoutParam() throws Exception 
    {
        mockMvc.perform(get("/addIngredient"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }

    @Test
    void testAddIngredientWithParam() throws Exception 
    {
        String ingredient = "tomato";

        mockMvc.perform(get("/addIngredient").param("ingredient", ingredient))
                .andExpect(status().isOk())
                .andExpect(content().string(ingredient));
    }

    @Test
    void testAddIngredientWithSpecialCharacters() throws Exception 
    {
        String ingredient = "egg & cheese";

        mockMvc.perform(get("/addIngredient").param("ingredient", ingredient))
                .andExpect(status().isOk())
                .andExpect(content().string(ingredient));
    }

    // -------------------------
    // /search tests - happy path
    // -------------------------
    @Test
    void testSearch_withNoIngredients() throws Exception 
    {
        mockMvc.perform(get("/search"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").isNotEmpty());
    }

    @Test
    void testSearch_withSingleIngredient() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "egg"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").isNotEmpty())
                .andExpect(jsonPath("$[0].ingredients").isArray());
    }

    @Test
    void testSearch_withMultipleIngredients() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "egg", "milk", "cheese"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").isNotEmpty())
                .andExpect(jsonPath("$[0].ingredients").isArray());
    }

    // -------------------------
    // /search tests - edge cases
    // -------------------------
    @Test
    void testSearch_withUnknownIngredient_returnsEmpty() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "unicorn_meat"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testSearch_withEmptyStringIngredient_behavesLikeNoIngredients() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", ""))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").isNotEmpty());
    }

    @Test
    void testSearch_withCaseInsensitiveIngredient() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "Egg"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").isNotEmpty());
    }

    // -------------------------
    // /search tests - ingredient normalization regression
    //
    // These guard against recipes being stored with plural ingredient
    // names (e.g. "eggs", "carrots") while users naturally search with
    // the singular form. Requires the DB to contain the normalized
    // recipe data (see ReFire_DB_1_Recipes_normalized.json) or these
    // will fail even though the API code itself is unchanged.
    // -------------------------
    @Test
    void testSearch_singularEgg_matchesRecipesFormerlyOnlyReachableByPlural() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "egg"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$[?(@.name=='Omelette with Spinach')]").exists())
                .andExpect(jsonPath("$[?(@.name=='Chocolate Brownies')]").exists());
    }

    @Test
    void testSearch_singularCarrot_matchesRecipesFormerlyOnlyReachableByPlural() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "carrot"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$[?(@.name=='Vegetable Curry')]").exists())
                .andExpect(jsonPath("$[?(@.name=='Lentil Soup')]").exists());
    }

    @Test
    void testSearch_singularBellPepper_matchesRecipesFormerlyOnlyReachableByPlural() throws Exception 
    {
        mockMvc.perform(get("/search").param("ingredient_list", "bell pepper"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$[?(@.name=='Chicken Fajitas')]").exists())
                .andExpect(jsonPath("$[?(@.name=='Stuffed Bell Peppers')]").exists());
    }

    @Test
    void testAllRecipes_containNoPluralIngredientNames() throws Exception 
    {
        // Data-integrity guard: fails if plural ingredient forms creep back in
        // (e.g. a new recipe added with "eggs" instead of "egg").
        java.util.List<String> knownPlurals = java.util.List.of(
                "eggs", "carrots", "bell peppers", "bananas", "cucumbers", "tortillas", "apples"
        );

        String response = mockMvc.perform(get("/search"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()
                .toLowerCase();

        for (String plural : knownPlurals) 
        {
            org.junit.jupiter.api.Assertions.assertFalse(
                    response.contains("\"" + plural + "\""),
                    "Found plural ingredient '" + plural + "' in recipe data; ingredients should be singular"
            );
        }
    }

    // -------------------------
    // /submitRecipe tests
    // -------------------------
    @Test
    void testSubmitRecipe_valid_createsPendingEntry() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "Valid Submission";
        String json = """
                {
                  "name": "%s",
                  "mealType": "SNACK",
                  "cookTime": 10,
                  "ingredients": ["egg", "toast"],
                  "instructions": "1. Toast bread. 2. Fry egg."
                }
                """.formatted(name);

        mockMvc.perform(post("/submitRecipe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.id").exists());

        org.junit.jupiter.api.Assertions.assertTrue(
                pendingRecipeRepository.findAll().stream().anyMatch(p -> name.equals(p.getName())),
                "Submitted recipe should appear in the pending collection"
        );
    }

    @Test
    void testSubmitRecipe_missingName_returnsBadRequest() throws Exception 
    {
        String json = """
                {
                  "mealType": "SNACK",
                  "cookTime": 10,
                  "ingredients": ["egg"],
                  "instructions": "1. Fry egg."
                }
                """;

        mockMvc.perform(post("/submitRecipe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitRecipe_emptyIngredients_returnsBadRequest() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "No Ingredients";
        String json = """
                {
                  "name": "%s",
                  "mealType": "SNACK",
                  "cookTime": 10,
                  "ingredients": [],
                  "instructions": "1. Fry egg."
                }
                """.formatted(name);

        mockMvc.perform(post("/submitRecipe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // -------------------------
    // /admin/pending tests
    // -------------------------
    @Test
    void testAdminPending_withoutKey_returnsUnauthorized() throws Exception 
    {
        mockMvc.perform(get("/admin/pending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminPending_withWrongKey_returnsUnauthorized() throws Exception 
    {
        mockMvc.perform(get("/admin/pending").header("X-Admin-Key", "definitely-wrong-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminPending_withValidKey_returnsPendingList() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "List Me";
        pendingRecipeRepository.save(new PendingRecipe(
                name, MealType.SNACK, 5, List.of("egg"), "1. Fry egg.", Instant.now()
        ));

        mockMvc.perform(get("/admin/pending").header("X-Admin-Key", adminKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='" + name + "')]").exists());
    }

    // -------------------------
    // /admin/approve and /admin/reject tests
    // -------------------------
    @Test
    void testAdminApprove_movesSubmissionToRecipesAndRemovesFromPending() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "Approve Me";
        PendingRecipe pending = pendingRecipeRepository.save(new PendingRecipe(
                name, MealType.SNACK, 5, List.of("egg"), "1. Fry egg.", Instant.now()
        ));

        String json = """
                {
                  "name": "%s",
                  "mealType": "SNACK",
                  "cookTime": 5,
                  "ingredients": ["egg"],
                  "instructions": "1. Fry egg."
                }
                """.formatted(name);

        mockMvc.perform(post("/admin/approve/" + pending.getId())
                        .header("X-Admin-Key", adminKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(name));

        org.junit.jupiter.api.Assertions.assertFalse(
                pendingRecipeRepository.existsById(pending.getId()),
                "Approved submission should be removed from the pending collection"
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                recipeRepository.findAll().stream().anyMatch(r -> name.equals(r.getName())),
                "Approved submission should now appear in the main Recipes collection"
        );
    }

    @Test
    void testAdminApprove_withoutKey_returnsUnauthorizedAndLeavesSubmissionPending() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "No Key Approve";
        PendingRecipe pending = pendingRecipeRepository.save(new PendingRecipe(
                name, MealType.SNACK, 5, List.of("egg"), "1. Fry egg.", Instant.now()
        ));

        String json = """
                {
                  "name": "%s",
                  "mealType": "SNACK",
                  "cookTime": 5,
                  "ingredients": ["egg"],
                  "instructions": "1. Fry egg."
                }
                """.formatted(name);

        mockMvc.perform(post("/admin/approve/" + pending.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());

        org.junit.jupiter.api.Assertions.assertTrue(pendingRecipeRepository.existsById(pending.getId()));
    }

    @Test
    void testAdminReject_removesSubmissionWithoutAddingToRecipes() throws Exception 
    {
        String name = TEST_RECIPE_PREFIX + "Reject Me";
        PendingRecipe pending = pendingRecipeRepository.save(new PendingRecipe(
                name, MealType.SNACK, 5, List.of("egg"), "1. Fry egg.", Instant.now()
        ));

        mockMvc.perform(delete("/admin/reject/" + pending.getId())
                        .header("X-Admin-Key", adminKey))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertFalse(pendingRecipeRepository.existsById(pending.getId()));
        org.junit.jupiter.api.Assertions.assertTrue(
                recipeRepository.findAll().stream().noneMatch(r -> name.equals(r.getName())),
                "Rejected submission should never appear in the main Recipes collection"
        );
    }
}