document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch products from the API
        const response = await fetch('/fashion');

        if (!response.ok) {
            throw new Error('Failed to fetch fashion');
        }

        const clothes = await response.json();
        console.log("Fetched clothes data:", clothes); // Debugging

        const clothesContainer = document.querySelector('#clothes-container');

        if (!clothesContainer) {
            console.error("Error: '#clothes-container' not found in the DOM.");
            return;
        }

        // Clear the container before adding new elements
        clothesContainer.innerHTML = '';

        // Generate product HTML
        let clotheHTML = '';
        clothes.forEach((clothe, index) => {
            clotheHTML += `
                <div class="col-lg-4 col-12 mb-3">
                    <div class="product-thumb">
                        <a data-index="${index}" style="cursor:pointer;" class="mode-btn">
                            <img src="${clothe.image}" class="img-fluid product-image" alt="${clothe.name}">
                        </a>

                        <div class="product-top d-flex">
                            <span class="product-alert me-auto">${clothe.name}</span>
                            <a style="cursor:pointer;" class="product-alert me-auto"> Price ${clothe.price} </a>
                            <a style="cursor:pointer;" class="bi-heart-fill product-icon check-btn" data-id="${clothe.id}"></a>
                        </div>

                        <div class="product-info d-flex">
                            <div>
                                <h5 class="product-title mb-0">
                                    <a href="product-detail.html" class="product-title-link">${clothe.title}</a>
                                </h5>
                                <p class="product-p">${clothe.short_description}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <br><br>
            `;
        });

        // Insert all products into the container at once
        clothesContainer.innerHTML = clotheHTML;

        // Add event listeners for the Read More buttons
        document.querySelectorAll('.mode-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const index = event.target.closest('.mode-btn')?.dataset.index;

                if (index !== undefined) {
                    const clothe = clothes[index];
                    if (clothe) {
                        document.querySelector('#mod-img').src = clothe.image;
                        document.querySelector('#mod-name').textContent = clothe.name;
                        document.querySelector('#mod-description').textContent = clothe.description;
                        document.querySelector('#viewMode').style.display = 'block';
                    } else {
                        console.error("Error: Invalid index or missing fashion data.", index);
                    }
                }
            });
        });

        // Close the modal
        document.querySelector('#close-modal').addEventListener('click', () => {
            document.querySelector('#viewMode').style.display = 'none';
        });

      


      
        // Add to favorite functionality
        document.querySelectorAll('.check-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                const productId = event.target.closest('.check-btn').dataset.id;

                try {
                    const sessionResponse = await fetch('/check-session');
                    const sessionData = await sessionResponse.json();

                    if (!sessionData.loggedIn) {
                        alert("Please login or sign up to add items to your favorite list.");
                        openAuthPopup(); // This will now call the global function
     // Toggle favorite list dropdown
     document.getElementById("logs-btn").addEventListener("click", () => {
        openAuthPopup(); // This will now call the global function
    });
                        return;
                    }

                         // Toggle favorite list dropdown
     document.getElementById("logs-btn").addEventListener("click", () => {
        const logsdropdown = document.getElementById("logsdropdown");
        logsdropdown.style.display = logsdropdown.style.display === "block" ? "none" : "block";
    });
                    const userEmail = sessionData.email;

                    // Add item to favorites
                    const favoriteResponse = await fetch('/add-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId, userEmail })
                    });

                    const favoriteData = await favoriteResponse.json();

                    if (favoriteData.success) {
                        alert("Item added to your favorite list!");
                        displayFavorites();
                    } else {
                        alert(favoriteData.message); // "Item already exists" message
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert("An error occurred. Please try again.");
                }
            });
        });

        // Display the user's favorite items
        async function displayFavorites() {
            try {
                const response = await fetch('/get-favorites');
                const favorites = await response.json();

                if (favorites.length === 0) {
                    document.querySelector('#favorite-container').innerHTML = "<p>No favorite items yet.</p>";
                    return;
                }

                let favoriteHTML = '<h3>Your Favorites</h3>';
                favorites.forEach(item => {
                    favoriteHTML += `
                        <div class="favorite-item">
                            <img src="${item.image}" alt="${item.name}" style="width:100px; height:auto;">
                            <p><strong>${item.name}</strong> - ${item.price}</p>
                        </div>
                    `;
                });

                document.querySelector('#favorite-container').innerHTML = favoriteHTML;
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        }

        // Initial load of favorites
        displayFavorites();

    } catch (error) {
        console.error('Error fetching fashion:', error);
        alert('Failed to load fashion. Please try again later.');
    }
});



    // Function to show error messages in a pop-up div
function showError(message) {
    const errorPopup = document.getElementById("error-popup");
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = message;
    errorPopup.style.display = "block";

    // Hide the message after 3 seconds
    setTimeout(() => {
        errorPopup.style.display = "none";
    }, 3000);
}


function openEmailPopup() {
    document.getElementById("email-popup").style.display = "block";
}

function closeEmailPopup() {
    document.getElementById("email-popup").style.display = "none";
}

function openAuthPopup() {
    document.getElementById("auth-popup").style.display = "block";
}

function closeAuthPopup() {
    document.getElementById("auth-popup").style.display = "none";
}

function toggleAuthForm(type) {
    if (type === 'signup') {
        document.getElementById("signup-form").style.display = "block";
        document.getElementById("login-form").style.display = "none";
    } else {
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("login-form").style.display = "block";
    }
}



async function signup() {
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (!name || !email || !password) {
        alert("All fields are required");
        return;
    }

    try {
        const response = await fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Signup failed");
        }

        alert(result.message);
        closeAuthPopup();
    } catch (error) {
        console.error("❌ Signup error:", error.message);
        alert("Signup failed: " + error.message);
    }
}



async function sendLoginRequest() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Email and password are required");
        return;
    }

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })  // ✅ Send password here
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
        document.getElementById("login-step-1").style.display = "none"; // Hide login form
        document.getElementById("login-step-2").style.display = "block"; // Show verification code input
    }
}

async function verifyLoginCode() {
    const code = document.getElementById("login-code").value;

    const response = await fetch("/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })  // ✅ Send only the code here
    });

    const result = await response.json();
    alert(result.message);

    if (result.success) {
        closeAuthPopup();
        location.reload();
    }
}




    // Toggle favorite list dropdown
    document.getElementById("favorite-btn").addEventListener("click", () => {
        const dropdown = document.getElementById("favorite-dropdown");
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        displayFavorites();
    });



    async function checkSession() {
        try {
            const response = await fetch('/check-session');
            const data = await response.json();
    
            if (data.loggedIn) {
                console.log("✅ Session Active:", data);
                document.getElementById("user-email").innerText = `Welcome, ${data.email}`;
            } else {
                console.log("❌ No active session.");
            }
        } catch (error) {
            console.error("❌ Error checking session:", error);
        }
    }
    
    // 🔄 Check session on page load after email verification
    window.addEventListener("load", () => {
        checkSession();
    });
    