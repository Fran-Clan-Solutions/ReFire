package com.ReFire.WebService.repository;

import com.ReFire.WebService.model.PendingRecipe;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PendingRecipeRepository extends MongoRepository<PendingRecipe, String>
{
}