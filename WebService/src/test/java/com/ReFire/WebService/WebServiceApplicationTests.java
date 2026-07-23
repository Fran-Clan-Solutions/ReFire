package com.ReFire.WebService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WebServiceApplicationTests 
{

    @Autowired
    private MockMvc mockMvc;

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
}