"""Import every model so SQLAlchemy registers them on `Base.metadata`."""
from app.models.user import User, RefreshToken                                # noqa: F401
from app.models.rbac import Role, Permission, UserRole, RolePermission, UserPermission  # noqa: F401
from app.models.customer import Company, Customer                              # noqa: F401
from app.models.crm import Lead, Opportunity, FollowUp, Note                   # noqa: F401
from app.models.catalog import ProductCategory, Product, PricingRule, ProductMaterial           # noqa: F401
from app.models.department import Department, product_departments  # noqa: F401
from app.models.order import Order, OrderItem, OrderItemStatusHistory, OrderStatusEvent, OrderWorkflowAssignment  # noqa: F401
from app.models.order_note import OrderNote  # noqa: F401
from app.models.production import PrintJob, DesignRevision, DesignApproval, Signature  # noqa: F401
from app.models.inventory import Warehouse, Material, StockMovement, MaterialUsage     # noqa: F401
from app.models.finance import Quotation, QuotationItem, Invoice, InvoiceItem, Payment, Expense  # noqa: F401
from app.models.support import Ticket, TicketMessage, Message                  # noqa: F401
from app.models.chat import Conversation, ConversationMember, ChatMessage      # noqa: F401
from app.models.marketing import Campaign, ContentPost, SocialAccount          # noqa: F401
from app.models.outdoor import Billboard, Vehicle, InstallationProject         # noqa: F401
from app.models.embroidery import EmbroideryProject                            # noqa: F401
from app.models.academic import School, Teacher, AcademicRequest               # noqa: F401
from app.models.attachment import Attachment                                   # noqa: F401
from app.models.notification import Notification                               # noqa: F401
from app.models.push_subscription import PushSubscription                     # noqa: F401
from app.models.audit import AuditLog, OutboxEmail                             # noqa: F401
from app.models.branding import BrandSettings                                  # noqa: F401
