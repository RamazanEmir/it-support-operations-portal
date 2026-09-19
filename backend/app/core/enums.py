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


class RequestType(str, Enum):
    SOFTWARE_INSTALLATION = "software_installation"
    ACCOUNT_CREATION = "account_creation"
    VPN_ACCESS = "vpn_access"
    PERMISSION_REQUEST = "permission_request"
    HARDWARE_REQUEST = "hardware_request"
    OTHER = "other"


class RequestStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"


class AssetCategory(str, Enum):
    LAPTOP = "laptop"
    DESKTOP = "desktop"
    MONITOR = "monitor"
    PHONE = "phone"
    PRINTER = "printer"
    NETWORK_DEVICE = "network_device"
    OTHER = "other"


class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"
