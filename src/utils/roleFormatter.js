export const formatRole = (role) => {
    if (!role) return "—";
    
    const roleMap = {
        "tl": "Team Leader",
        "hr": "Human Resources",
        "bdm": "Business Development Manager",
        "bde": "Business Development Executive",
        "employee": "Employee",
        "admin": "Administrator",
        "superadmin": "Super Administrator"
    };

    const normalizedRole = role.toLowerCase();
    return roleMap[normalizedRole] || role.charAt(0).toUpperCase() + role.slice(1);
};
