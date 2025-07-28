package com.ReFire.WebService;

import java.util.List;

import com.ReFire.WebService.model.Recipe;
import com.ReFire.WebService.repository.RecipeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class WebServiceApplication
{
    @Autowired
    private RecipeRepository recipeRepository;

    public static void main(String[] args)
    {
        SpringApplication.run(WebServiceApplication.class, args);
    }

    @GetMapping("/search")
    public List<Recipe> search(@RequestParam(value = "ingredient_list", required = false) List<String> ingredient_list)
    {
        if (ingredient_list == null || ingredient_list.isEmpty())
        {
            // Return all recipes if no ingredients provided
            return recipeRepository.findAll();
        }

        // Return recipes that contain any of the specified ingredients
        return recipeRepository.findByIngredientsIn(ingredient_list);
    }

    @GetMapping("/addIngredient")
    public String addIngredient(@RequestParam(value = "ingredient", defaultValue = "") String ingredient)
    {
        return String.format(ingredient);
    }
}