let mIngredient_list = []

function addIngredient() {
    var mIngredient = $("#ingredient_input").val().trim();

    if (!mIngredient) return; // ignore empty input

    $.ajax({
        url: "/addIngredient?ingredient=" + encodeURIComponent(mIngredient),
        success: function(res) {
            if (res !== "") {
                // Add table header if it's the first ingredient
                if (mIngredient_list.length === 0) {
                    $("#ingredient_list").append("<tr id='ingredient_header'><th>Ingredients</th></tr>");
                }

                // Add the new row
                $("#ingredient_list").append("<tr><td>" + res + "</td></tr>");
                mIngredient_list.push(mIngredient);
                $("#ingredient_input").val(""); // clear input
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