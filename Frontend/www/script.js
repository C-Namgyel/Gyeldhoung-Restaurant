const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
    for (let el of reveals) {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;

        if (elementTop < windowHeight - 80) {
            el.classList.add("active");
        }
    }
}

// run on scroll
window.addEventListener("scroll", revealOnScroll);

// run once on load (IMPORTANT)
revealOnScroll();

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("nav");

if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.classList.toggle("active", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            navToggle.classList.remove("active");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
}
