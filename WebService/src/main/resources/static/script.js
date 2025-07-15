let mIngredient_list = []

function addIngredient()
{
    var mIngredient = $("#ingredient_input").val();

    $.ajax
    ({
        url: "/addIngredient?ingredient=" + mIngredient,
        success: function(res) 
        {
            var row_html_str = "<tr><td>" + res +"</td></tr>";
    
            if(res != "")
            {
                $("#ingredient_list").append(row_html_str);
                const ingredient = mIngredient.trim();
                if (ingredient) 
                {
                    mIngredient_list.push(ingredient);
                    $("#ingredient_input").val(""); // clear input
                }
                console.log(res + " appended");
            }
        }
    });
}

function search() 
{
    const params = new URLSearchParams();
    mIngredient_list.forEach(i => params.append("ingredient_list", i));

    // Navigate to recipes.html with query params
    window.location.href = `recipes.html?${params.toString()}`;
}