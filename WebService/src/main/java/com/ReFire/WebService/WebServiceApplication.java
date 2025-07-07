package com.ReFire.WebService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.ReFire.WebService.model.MealType;
import com.ReFire.WebService.model.Recipe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class WebServiceApplication
{

    // example in-memory "database"
    private List<Recipe> recipes = new ArrayList<>(List.of(
        new Recipe("Pancakes", MealType.BREAKFAST, 20,
            Arrays.asList("flour", "egg", "milk", "sugar"),
            "Mix all ingredients, pour batter on hot griddle, flip, and serve."),
        new Recipe("Omelette", MealType.BREAKFAST, 10,
            Arrays.asList("egg", "cheese", "salt"),
            "Whisk eggs, cook in pan with cheese."),
        new Recipe("Salad", MealType.LUNCH, 15,
            Arrays.asList("lettuce", "tomato", "cucumber", "olive oil"),
            "Chop veggies, toss with dressing."),
        new Recipe("Grilled Cheese", MealType.LUNCH, 10,
            Arrays.asList("bread", "cheese", "butter"),
            "Butter bread, add cheese, and grill.")
    ));
    
    public static void main(String[] args) 
    {
      SpringApplication.run(WebServiceApplication.class, args);
    }
    
    @GetMapping("/search")
    public List<Recipe>  search(@RequestParam(value = "ingredient_list", required = false) List<String> ingredient_list)
    {

        if (ingredient_list == null || ingredient_list.isEmpty())
        {
            // if no ingredients passed, return all recipes
            return recipes;
        }

        // filter recipes: any ingredient matches
        List<Recipe> result = recipes.stream()
            .filter(recipe ->
                recipe.getIngredients().stream()
                      .anyMatch(ingredient_list::contains)
            )
            .collect(Collectors.toList());

        return result;
    }
    
    @GetMapping("/addIngredient")
    public String addIngredient(@RequestParam(value = "ingredient", defaultValue = "") String ingredient)
    {
    	return String.format(ingredient);
    }
}