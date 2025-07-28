package com.ReFire.WebService.model;

import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Recipes")
public class Recipe
{
    @Id
    private String id;  // MongoDB internal ID
    
    private String name;               // name of the recipe
    private MealType mealType;         // BREAKFAST, LUNCH, DINNER, SNACK
    private int cookTime;            // in minutes
    private List<String> ingredients; // added to support searching
    private String instructions;      // full text of instructions

    public Recipe() 
    {
    	
    }

    public Recipe(String name, MealType mealType, int cookTime, List<String> ingredients, String instructions)
    {
        this.name = name;
        this.mealType = mealType;
        this.cookTime = cookTime;
        this.ingredients = ingredients;
        this.instructions = instructions;
    }

    // getters & setters
    public String getId() 
    {
        return id;
    }

    public void setId(String id) 
    {
        this.id = id;
    }
    
    public String getName() 
    {
    	return name;
    }
    
    public void setName(String name)
    {
    	this.name = name; 
    }

    public MealType getMealType()
    {
    	return mealType;
    }
    
    public void setMealType(MealType mealType)
    {
    	this.mealType = mealType;
    }

    public int getCookTime()
    {
    	return cookTime;
    }
    
    public void setCookTime(int cookTime)
    {
    	this.cookTime = cookTime;
    }

    public List<String> getIngredients()
    {
    	return ingredients;
    }
    
    public void setIngredients(List<String> ingredients)
    {
    	this.ingredients = ingredients;
    }

    public String getInstructions()
    {
    	return instructions;
    }
    
    public void setInstructions(String instructions)
    {
    	this.instructions = instructions;
    }

    @Override
    public String toString() 
    {
        return "Recipe{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", mealType=" + mealType +
                ", cookTime=" + cookTime +
                ", ingredients=" + ingredients +
                ", instructions='" + instructions + '\'' +
                '}';
    }
}