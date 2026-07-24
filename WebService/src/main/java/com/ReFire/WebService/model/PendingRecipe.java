package com.ReFire.WebService.model;

import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

// A recipe submitted by a user, awaiting admin review. Kept in its own
// collection (separate from Recipes) so unapproved content never shows up
// in /search results by accident.
@Document(collection = "PendingRecipes")
public class PendingRecipe
{
    @Id
    private String id;

    private String name;
    private MealType mealType;
    private int cookTime;
    private List<String> ingredients;
    private String instructions;
    private Instant submittedAt;

    public PendingRecipe()
    {

    }

    public PendingRecipe(String name, MealType mealType, int cookTime, List<String> ingredients, String instructions, Instant submittedAt)
    {
        this.name = name;
        this.mealType = mealType;
        this.cookTime = cookTime;
        this.ingredients = ingredients;
        this.instructions = instructions;
        this.submittedAt = submittedAt;
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

    public Instant getSubmittedAt()
    {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt)
    {
        this.submittedAt = submittedAt;
    }

    @Override
    public String toString()
    {
        return "PendingRecipe{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", mealType=" + mealType +
                ", cookTime=" + cookTime +
                ", ingredients=" + ingredients +
                ", instructions='" + instructions + '\'' +
                ", submittedAt=" + submittedAt +
                '}';
    }
}