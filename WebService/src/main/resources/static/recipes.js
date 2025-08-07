let allRecipes = [];
let mIngredient_list = [];

$(document).ready(function () 
{
    const params = new URLSearchParams(window.location.search);
    mIngredient_list = params.getAll("ingredient_list").map(i => i.toLowerCase());

    renderIngredientTags();
    fetchRecipes();

    $('.meal-filter').on('change', renderRecipes);

    $('#ingredient_input').on('keydown', function (e) 
    {
        if (e.key === "Enter") {
            e.preventDefault();
            addIngredient();
        }
    });

    // Remove ingredient on 'X' click
    $(document).on("click", ".remove-tag", function () 
    {
        const ingredient = $(this).data("ingredient").toLowerCase();
        mIngredient_list = mIngredient_list.filter(i => i !== ingredient);
        renderIngredientTags();
        renderRecipes();
    });
});

// Render interactive ingredient tags
function renderIngredientTags() 
{
    const tagHTML = mIngredient_list.map(i => `
        <span class='badge bg-secondary ingredient-badge me-2 mb-2'>
            ${i}
            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-ingredient="${i}">&times;</span>
        </span>
    `).join("");
    $("#ingredient_list").html(tagHTML);
}

// Add ingredient from input
function addIngredient() 
{
    const inputVal = $('#ingredient_input').val().trim().toLowerCase();
    if (!inputVal || mIngredient_list.includes(inputVal)) return;

    mIngredient_list.push(inputVal);
    $('#ingredient_input').val('');
    renderIngredientTags();
    renderRecipes();
}

// Initial fetch from server
function fetchRecipes() 
{
    $.ajax({
        url: "/search",
        data: { ingredient_list: mIngredient_list },
        traditional: true,
        success: function (recipes) 
        {
            allRecipes = recipes || [];
            renderRecipes();
        }
    });
}

function renderRecipes() 
{
    const userIngredients = mIngredient_list;

    const selectedFilters = $('.meal-filter:checked')
        .map(function () { return this.value.toUpperCase(); })
        .get();

    let filteredRecipes = allRecipes;

    // Filter by meal type
    if (selectedFilters.length > 0) 
    {
        filteredRecipes = allRecipes.filter(recipe =>
            selectedFilters.includes(recipe.mealType.toUpperCase()));
    }

    // Sort: by number of matches (desc), then by cook time (asc)
    filteredRecipes.sort((a, b) => 
    {
        const aMatches = a.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;
        const bMatches = b.ingredients.filter(ing => userIngredients.includes(ing.toLowerCase())).length;

        if (bMatches !== aMatches) 
        {
            return bMatches - aMatches;
        }
        return a.cookTime - b.cookTime;
    });

    let html = "";

    if (filteredRecipes.length === 0) 
    {
        html = "<p>No recipes found.</p>";
    } else {
        html = "<ul class='list-unstyled'>";
        filteredRecipes.forEach((recipe, index) => 
        {
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

    $(".recipe-header").on("click", function () 
    {
        const index = $(this).data("index");
        const recipe = filteredRecipes[index];

        const highlightedIngredients = recipe.ingredients.map(ing => 
        {
            if (userIngredients.includes(ing.toLowerCase()))
            {
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