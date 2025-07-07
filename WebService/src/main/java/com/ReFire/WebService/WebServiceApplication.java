package com.ReFire.WebService;
import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class WebServiceApplication
{
    public static void main(String[] args) 
    {
      SpringApplication.run(WebServiceApplication.class, args);
    }
    
    @GetMapping("/search")
    public String search(@RequestParam(value = "ingredient_list", required = false) List<String> ingredient_list)
    {
        if (ingredient_list == null)
        {
            ingredient_list = List.of("");
        }
        return "Searching for recipes with the following ingredients: " + ingredient_list;
    }
    
    @GetMapping("/addIngredient")
    public String addIngredient(@RequestParam(value = "ingredient", defaultValue = "") String ingredient)
    {
    	return String.format(ingredient);
    }
}