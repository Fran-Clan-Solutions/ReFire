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
        // This verifies that the Spring context loads without errors
	}
	
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
    public void testSearch_withSingleIngredient() throws Exception
    {
        mockMvc.perform(get("/search")
                .param("ingredient_list", "egg"))
                .andExpect(status().isOk())
                .andExpect(content().string("Searching for recipes with the following ingredients: [egg]"));
    }

    @Test
    public void testSearch_withMultipleIngredients() throws Exception
    {
        mockMvc.perform(get("/search")
                .param("ingredient_list", "egg", "milk", "cheese"))
                .andExpect(status().isOk())
                .andExpect(content().string("Searching for recipes with the following ingredients: [egg, milk, cheese]"));
    }

    @Test
    public void testSearch_withNoIngredients() throws Exception
    {
        mockMvc.perform(get("/search"))
                .andExpect(status().isOk())
                .andExpect(content().string("Searching for recipes with the following ingredients: []"));
    }
}
