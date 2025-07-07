let mIngredient_list = []

function addIngredient()
{
    var mIngredient = $("#ingredient_input").val();

    $.ajax
    ({
        url:"http://localhost:8080/addIngredient?ingredient=" + mIngredient,
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

function search() {
    $.ajax({
        url: "http://localhost:8080/search",
        data: { ingredient_list: mIngredient_list },
        traditional: true,
        success: function (res) {
            console.log(res);
        }
    });
}