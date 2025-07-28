package com.ReFire.WebService.repository;

import java.util.List;

import com.ReFire.WebService.model.Recipe;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RecipeRepository extends MongoRepository<Recipe, String>
{
    List<Recipe> findByIngredientsIn(List<String> ingredients);
}
