"""Order models: Order, OrderItem, workflow history, order-level status events."""

from __future__ import annotations



from datetime import date, datetime

from typing import TYPE_CHECKING, List, Optional



from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint

from sqlalchemy.orm import Mapped, mapped_column, relationship



from app.db.base import Base, IntPK, SoftDeleteMixin, TimestampMixin



if TYPE_CHECKING:

    from app.models.department import Department
    from app.models.user import User
    from app.models.order_note import OrderNote





ORDER_STATUSES = (

    "draft",

    "pending_review",

    "awaiting_customer",

    "customer_approved",

    "confirmed",

    "paid",

    "in_production",

    "delivered",

    "closed",

    "cancelled",

)

# Orders in production pipeline (payment received or actively executing).
PRODUCTION_ORDER_STATUSES = ("paid", "in_production")

# Roles allowed to set or clear the paid status.
PAID_STATUS_ROLE_SLUGS = frozenset({"accountant", "general_manager"})





class Order(IntPK, TimestampMixin, SoftDeleteMixin, Base):

    __tablename__ = "orders"



    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)

    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)

    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    department: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)



    status: Mapped[str] = mapped_column(String(40), default="draft", nullable=False, index=True)

    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)

    placed_via: Mapped[str] = mapped_column(String(20), default="staff", nullable=False)  # portal/staff



    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)

    delivery_method: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)



    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    tax_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    discount_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    grand_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)



    items: Mapped[List["OrderItem"]] = relationship(

        back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id")

    events: Mapped[List["OrderStatusEvent"]] = relationship(

        back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusEvent.id")

    workflow_assignments: Mapped[List["OrderWorkflowAssignment"]] = relationship(

        back_populates="order", cascade="all, delete-orphan", order_by="OrderWorkflowAssignment.workflow_status")

    project_notes: Mapped[List["OrderNote"]] = relationship(

        back_populates="order", cascade="all, delete-orphan", order_by="OrderNote.id")





class OrderWorkflowAssignment(IntPK, TimestampMixin, Base):

    """Per-order staff responsible for advancing a pipeline stage."""

    __tablename__ = "order_workflow_assignments"

    __table_args__ = (

        UniqueConstraint(
            "order_id", "workflow_status", "assignee_id",
            name="uq_order_workflow_stage_assignee",
        ),

    )



    order_id: Mapped[int] = mapped_column(

        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    workflow_status: Mapped[str] = mapped_column(String(40), nullable=False, index=True)

    assignee_id: Mapped[int] = mapped_column(

        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    is_skipped: Mapped[bool] = mapped_column(default=False, server_default="0")

    assigned_by_id: Mapped[Optional[int]] = mapped_column(

        ForeignKey("users.id", ondelete="SET NULL"), nullable=True)



    order: Mapped["Order"] = relationship(back_populates="workflow_assignments")

    assignee: Mapped["User"] = relationship(foreign_keys=[assignee_id])

    assigned_by: Mapped[Optional["User"]] = relationship(foreign_keys=[assigned_by_id])





class OrderItem(IntPK, TimestampMixin, Base):

    __tablename__ = "order_items"



    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    quantity: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)

    unit_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    discount_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    tax_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    line_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    spec: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)



    workflow_status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)

    current_department_id: Mapped[Optional[int]] = mapped_column(

        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True

    )



    order: Mapped[Order] = relationship(back_populates="items")

    current_department: Mapped[Optional["Department"]] = relationship(foreign_keys=[current_department_id])

    status_history: Mapped[List["OrderItemStatusHistory"]] = relationship(

        back_populates="order_item", cascade="all, delete-orphan", order_by="OrderItemStatusHistory.id"

    )





class OrderItemStatusHistory(IntPK, TimestampMixin, Base):

    """Per-item workflow tracking — each department updates status independently."""

    __tablename__ = "order_item_status_history"



    order_item_id: Mapped[int] = mapped_column(

        ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True

    )

    department_id: Mapped[Optional[int]] = mapped_column(

        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True

    )

    from_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    to_status: Mapped[str] = mapped_column(String(40), nullable=False)

    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)



    order_item: Mapped[OrderItem] = relationship(back_populates="status_history")

    department: Mapped[Optional["Department"]] = relationship()





class OrderStatusEvent(IntPK, TimestampMixin, Base):

    __tablename__ = "order_status_events"



    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    from_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    to_status: Mapped[str] = mapped_column(String(40), nullable=False)

    actor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)



    order: Mapped[Order] = relationship(back_populates="events")

