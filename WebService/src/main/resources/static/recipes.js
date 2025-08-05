let allRecipes = [];

$(document).ready(function ()
{
    const params = new URLSearchParams(window.location.search);
    const ingredients = params.getAll("ingredient_list");

    // Fetch recipes once
    $.ajax({
        url: "/search",
        data:
        { 
            ingredient_list: ingredients
        },
        traditional: true,
        success: function (recipes)
        {
            allRecipes = recipes || [];
            renderRecipes(); // initial render
        }
    });

    // Listen for changes on any meal filter checkbox
    $('.meal-filter').on('change', function ()
    {
        renderRecipes(); // re-render on filter change
    });
});

function renderRecipes() {
    const params = new URLSearchParams(window.location.search);
    const userIngredients = params.getAll("ingredient_list").map(i => i.toLowerCase());

    const selectedFilters = $('.meal-filter:checked')
        .map(function () { return this.value.toUpperCase(); })
        .get();

    let filteredRecipes = allRecipes;

    // Filter by meal type
    if (selectedFilters.length > 0) {
        filteredRecipes = allRecipes.filter(recipe =>
            selectedFilters.includes(recipe.mealType.toUpperCase()));
    }

    // Sort: by number of matches (desc), then by cook time (asc)
    filteredRecipes.sort((a, b) => {
        const aMatches = a.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;
        const bMatches = b.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;

        if (bMatches !== aMatches) {
            return bMatches - aMatches; // more matches first
        }
        return a.cookTime - b.cookTime; // shorter cook time first
    });

    let html = "";

    if (filteredRecipes.length === 0) {
        html = "<p>No recipes found.</p>";
    } else {
        html = "<ul class='list-unstyled'>";
        filteredRecipes.forEach((recipe, index) => {
            html += `
                <li class="mb-3 border-bottom pb-2">
                    <div class="recipe-header" style="cursor: pointer;" data-index="${index}">
                        <strong>${recipe.name}</strong><br>
                        Time: ${recipe.cookTime} minutes
                    </div>
                </li>`;
        });
        html += "</ul>";
    }

    $("#recipes_list").html(html);

    $(".recipe-header").on("click", function () {
        const index = $(this).data("index");
        const recipe = filteredRecipes[index];

        // Highlight matching ingredients in blue
        const highlightedIngredients = recipe.ingredients.map(ing => {
            if (userIngredients.includes(ing.toLowerCase())) {
                return `<span class="highlight-ingredient">${ing}</span>`;
            }
            return ing;
        });

        $("#recipeDetailContent").html(`
            <h4 class="text-danger">Recipe: <span class="text-primary">${recipe.name}</span></h4>
            <p><strong>Cook Time:</strong> ${recipe.cookTime} minutes</p>
            <p><strong>Ingredients:</strong><br> ${highlightedIngredients.join(", ")}</p>
            <p><strong>Instructions:</strong><br> ${recipe.instructions}</p>
        `);

        $("#recipeDetailPanel").addClass("open");
    });

    $("#closePanel").on("click", function () {
        $("#recipeDetailPanel").removeClass("open");
    });
}

function backToSearch()
{
    window.location.href = `index.html`;
}
