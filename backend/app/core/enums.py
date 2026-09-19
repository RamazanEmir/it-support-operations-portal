from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    EMPLOYEE = "employee"


class TicketCategory(str, Enum):
    MICROSOFT_365 = "microsoft_365"
    HARDWARE = "hardware"
    NETWORK = "network"
    SOFTWARE = "software"
    PRINTER = "printer"
    OTHER = "other"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
