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
}
