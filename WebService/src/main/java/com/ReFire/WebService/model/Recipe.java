package com.ReFire.WebService.model;

import java.util.List;

public class Recipe
{
    private String name;               // name of the recipe
    private MealType mealType;         // BREAKFAST, LUNCH, DINNER, SNACK
    private int timeToMake;            // in minutes
    private List<String> ingredients; // added to support searching
    private String instructions;      // full text of instructions

    public Recipe() 
    {
    	
    }

    public Recipe(String name, MealType mealType, int timeToMake, List<String> ingredients, String instructions)
    {
        this.name = name;
        this.mealType = mealType;
        this.timeToMake = timeToMake;
        this.ingredients = ingredients;
        this.instructions = instructions;
    }

    // getters & setters
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

    public int getTimeToMake()
    {
    	return timeToMake;
    }
    
    public void setTimeToMake(int timeToMake)
    {
    	this.timeToMake = timeToMake;
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
                "name='" + name + '\'' +
                ", mealType=" + mealType +
                ", timeToMake=" + timeToMake +
                ", ingredients=" + ingredients +
                ", instructions='" + instructions + '\'' +
                '}';
    }
}