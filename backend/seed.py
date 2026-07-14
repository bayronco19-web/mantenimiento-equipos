"""Poblar la base de datos con equipos reales del sector gas/vapor."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timedelta, timezone
from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash

models.Base.metadata.create_all(bind=engine)


def reset_db(db):
    """Borra todos los datos en orden correcto (respetando FK)."""
    db.query(models.ProductOffer).delete()
    db.query(models.Product).delete()
    db.query(models.Store).delete()
    db.query(models.PriceCategory).delete()
    db.query(models.Alert).delete()
    db.query(models.EquipmentLifecycle).delete()
    db.query(models.WorkOrderSparePart).delete()
    db.query(models.WorkOrder).delete()
    db.query(models.PlanTool).delete()
    db.query(models.PlanConsumable).delete()
    db.query(models.ChecklistItem).delete()
    db.query(models.MaintenancePlan).delete()
    db.query(models.Equipment).delete()
    db.query(models.EquipmentCategory).delete()
    db.query(models.Tool).delete()
    db.query(models.Consumable).delete()
    db.query(models.SparePart).delete()
    db.query(models.Technician).delete()
    db.query(models.User).delete()
    db.commit()
    print("Base de datos limpiada.")


def seed():
    db = SessionLocal()
    try:
        force = "--force" in sys.argv or "-f" in sys.argv
        if db.query(models.User).count() > 0:
            if not force:
                print("Ya hay datos. Usa '--force' para reemplazarlos: python seed.py --force")
                return
            reset_db(db)

        today = date.today()

        # ─── USUARIOS ────────────────────────────────────────────────────────
        users = [
            models.User(username="admin", email="admin@cmms.com", full_name="Administrador Sistema",
                        hashed_password=get_password_hash("admin123"), role=models.UserRole.admin),
            models.User(username="supervisor1", email="super1@cmms.com", full_name="Carlos Mendoza",
                        hashed_password=get_password_hash("super123"), role=models.UserRole.supervisor),
            models.User(username="tecnico1", email="tec1@cmms.com", full_name="Juan García",
                        hashed_password=get_password_hash("tec123"), role=models.UserRole.technician),
            models.User(username="tecnico2", email="tec2@cmms.com", full_name="María López",
                        hashed_password=get_password_hash("tec123"), role=models.UserRole.technician),
            models.User(username="tecnico3", email="tec3@cmms.com", full_name="Pedro Ramírez",
                        hashed_password=get_password_hash("tec123"), role=models.UserRole.technician),
            models.User(username="visor1", email="visor@cmms.com", full_name="Ana Torres",
                        hashed_password=get_password_hash("ver123"), role=models.UserRole.viewer),
        ]
        for u in users:
            db.add(u)
        db.flush()

        # ─── TÉCNICOS ────────────────────────────────────────────────────────
        techs = [
            models.Technician(user_id=users[2].id, employee_code="TEC-001",
                              specialties='["Mecánica", "Gas Natural", "Calderas"]',
                              certifications='["RETIE", "ICONTEC NTC 2060"]', phone="555-0101"),
            models.Technician(user_id=users[3].id, employee_code="TEC-002",
                              specialties='["Eléctrica", "Instrumentación", "Quemadores"]',
                              certifications='["RETIE", "Gas Licuado GLP"]', phone="555-0102"),
            models.Technician(user_id=users[4].id, employee_code="TEC-003",
                              specialties='["Soldadura", "Tuberías", "Vaporizadores"]',
                              certifications='["ASME", "Soldador Certificado 6G"]', phone="555-0103"),
        ]
        for t in techs:
            db.add(t)

        # ─── CATEGORÍAS ──────────────────────────────────────────────────────
        cats = [
            models.EquipmentCategory(name="Calderas", description="Generadores de vapor y agua caliente", icon="flame"),
            models.EquipmentCategory(name="Quemadores", description="Sistemas de combustión a gas", icon="zap"),
            models.EquipmentCategory(name="Vaporizadores", description="Vaporizadores y evaporadores de gas", icon="wind"),
            models.EquipmentCategory(name="Dispensadores de Gas", description="Dispensadores y surtidores de GLP y gas natural", icon="droplets"),
        ]
        for c in cats:
            db.add(c)
        db.flush()

        # ─── EQUIPOS ─────────────────────────────────────────────────────────
        equipment_list = [
            models.Equipment(
                code="CAL-001", name="Caldera Pirotubular Cleaver Brooks", category_id=cats[0].id,
                brand="Cleaver Brooks", model="CB-200-HP", serial_number="CB2018-200-001",
                location="Sala de Calderas - Planta Principal", area="Producción",
                status=models.EquipmentStatus.active, criticality=models.Criticality.high,
                purchase_date=date(2018, 5, 10), installation_date=date(2018, 6, 1),
                warranty_expiry=today + timedelta(days=180),
                last_maintenance=today - timedelta(days=20),
                next_maintenance=today + timedelta(days=10),
                description="Caldera pirotubular 200 BHP, presión de trabajo 100 PSI, combustible gas natural. "
                            "Genera vapor saturado para proceso industrial.",
                technical_specs='{"capacidad": "200 BHP", "presion_trabajo": "100 PSI", "presion_diseno": "150 PSI", "combustible": "Gas Natural", "eficiencia": "85%", "temperatura_vapor": "170°C"}',
            ),
            models.Equipment(
                code="QUE-001", name="Quemador Baltur TBG 450 P", category_id=cats[1].id,
                brand="Baltur", model="TBG 450 P", serial_number="BAL2019-450-001",
                location="Sala de Calderas - Planta Principal", area="Producción",
                status=models.EquipmentStatus.active, criticality=models.Criticality.high,
                purchase_date=date(2019, 1, 15), installation_date=date(2019, 2, 1),
                warranty_expiry=today + timedelta(days=90),
                last_maintenance=today - timedelta(days=35),
                next_maintenance=today + timedelta(days=25),
                description="Quemador modulante a gas natural para caldera 200 BHP. "
                            "Sistema electrónico de control de llama y relación aire-gas automática.",
                technical_specs='{"potencia_min": "320 kW", "potencia_max": "1350 kW", "combustible": "Gas Natural", "presion_gas": "20-50 mbar", "voltaje": "220V / 60Hz", "control": "Modulante"}',
            ),
            models.Equipment(
                code="VAP-001", name="Vaporizador Eléctrico Algas SDI", category_id=cats[2].id,
                brand="Algas Technologies", model="SDI-500", serial_number="ALG2020-500-001",
                location="Estación de Regulación - Patio", area="Servicios",
                status=models.EquipmentStatus.active, criticality=models.Criticality.high,
                purchase_date=date(2020, 3, 20), installation_date=date(2020, 4, 10),
                warranty_expiry=today + timedelta(days=270),
                last_maintenance=today - timedelta(days=45),
                next_maintenance=today + timedelta(days=45),
                description="Vaporizador eléctrico de GLP 500 kg/h. Convierte GLP líquido a gas para "
                            "suministro a planta. Sistema de control automático de temperatura.",
                technical_specs='{"capacidad": "500 kg/h", "potencia_electrica": "36 kW", "voltaje": "220/440V", "presion_salida": "1.5 bar", "temperatura_bano": "60°C", "fluido_calefactor": "Agua"}',
            ),
            models.Equipment(
                code="DIS-001", name="Dispensador de GLP Gilbarco E700", category_id=cats[3].id,
                brand="Gilbarco Veeder-Root", model="E700 G", serial_number="GIL2021-E7-001",
                location="Isla de Surtido 1 - Patio", area="Distribución",
                status=models.EquipmentStatus.active, criticality=models.Criticality.medium,
                purchase_date=date(2021, 8, 5), installation_date=date(2021, 8, 20),
                warranty_expiry=today + timedelta(days=365),
                last_maintenance=today - timedelta(days=60),
                next_maintenance=today + timedelta(days=30),
                description="Dispensador de GLP para carga de cilindros y vehículos. "
                            "Sistema de medición fiscal con totalizador. Manguera retráctil de alta presión.",
                technical_specs='{"caudal": "80 L/min", "presion_trabajo": "8 bar", "medicion": "Fiscal certificada", "display": "LCD Iluminado", "voltaje": "110V / 60Hz"}',
            ),
        ]
        for eq in equipment_list:
            db.add(eq)
        db.flush()

        # ─── HERRAMIENTAS ─────────────────────────────────────────────────────
        # Herramientas comunes
        tools = [
            # --- CALDERA ---
            models.Tool(code="HER-001", name="Llave de Tubo 14\"", category="Mecánica",
                        quantity_available=2, location="Taller - Estante A", condition="good",
                        description="Llave stilson para tuberías de alta presión"),
            models.Tool(code="HER-002", name="Llave de Tubo 12\"", category="Mecánica",
                        quantity_available=2, location="Taller - Estante A", condition="good"),
            models.Tool(code="HER-003", name="Llave Inglesa 12\"", category="Mecánica",
                        quantity_available=3, location="Taller - Estante A", condition="good"),
            models.Tool(code="HER-004", name="Analizador de Gases de Combustión Testo 330", category="Diagnóstico",
                        quantity_available=1, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=90),
                        description="Mide CO, CO2, O2, temperatura de gases y eficiencia de combustión"),
            models.Tool(code="HER-005", name="Termómetro de Contacto Digital", category="Diagnóstico",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=120)),
            models.Tool(code="HER-006", name="Manómetro de Presión Calibrado 0-200 PSI", category="Diagnóstico",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180),
                        description="Manómetro de glicerina para verificación de presiones en caldera"),
            models.Tool(code="HER-007", name="Bomba de Prueba Hidráulica Manual", category="Mecánica",
                        quantity_available=1, location="Taller - Estante B", condition="good",
                        description="Bomba para prueba de presión hidrostática hasta 300 PSI"),
            models.Tool(code="HER-008", name="Cepillo de Acero para Tubos de Caldera", category="Limpieza",
                        quantity_available=3, location="Taller - Estante C", condition="good",
                        description="Cepillo cilíndrico para limpieza interna de tubos de fuego"),
            models.Tool(code="HER-009", name="Juego Llaves de Boca y Corona 8-32mm", category="Mecánica",
                        quantity_available=2, location="Taller - Estante A", condition="good"),
            models.Tool(code="HER-010", name="Juego Desarmadores (Pala / Phillips / Torx)", category="Mecánica",
                        quantity_available=4, location="Taller - Estante A", condition="good"),

            # --- QUEMADOR ---
            models.Tool(code="HER-011", name="Llave Torx T20", category="Mecánica",
                        quantity_available=4, location="Taller - Estante A", condition="good",
                        description="Torx T20 para desmontaje de carcasa y tapa frontal del quemador"),
            models.Tool(code="HER-012", name="Llave Torx T25", category="Mecánica",
                        quantity_available=4, location="Taller - Estante A", condition="good",
                        description="Torx T25 para fijaciones internas del quemador Baltur"),
            models.Tool(code="HER-013", name="Llave Torx T30", category="Mecánica",
                        quantity_available=3, location="Taller - Estante A", condition="good",
                        description="Torx T30 para anclajes del cabezal de combustión"),
            models.Tool(code="HER-014", name="Detector de Fugas de Gas Electrónico", category="Seguridad",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=60),
                        description="Detecta fugas de gas natural y GLP, sensibilidad 10 ppm"),
            models.Tool(code="HER-015", name="Multímetro Digital Fluke 87V", category="Eléctrica",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180)),
            models.Tool(code="HER-016", name="Manómetro de Presión de Gas 0-100 mbar", category="Diagnóstico",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180),
                        description="Para medir presión de gas en rampa y entrada del quemador"),
            models.Tool(code="HER-017", name="Pistola de Aire Comprimido", category="Limpieza",
                        quantity_available=2, location="Taller - Estante C", condition="good",
                        description="Para soplar fotocélula, electrodos y difusor del quemador"),
            models.Tool(code="HER-018", name="Juego Llaves Allen 2-10mm", category="Mecánica",
                        quantity_available=3, location="Taller - Estante A", condition="good"),

            # --- VAPORIZADOR ---
            models.Tool(code="HER-019", name="Termómetro Infrarrojo Digital", category="Diagnóstico",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=90)),
            models.Tool(code="HER-020", name="Llave de Tubo 10\"", category="Mecánica",
                        quantity_available=2, location="Taller - Estante A", condition="good"),
            models.Tool(code="HER-021", name="Pinza Amperimétrica Fluke 376", category="Eléctrica",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180),
                        description="Para medir corriente de resistencias eléctricas del vaporizador"),

            # --- DISPENSADOR ---
            models.Tool(code="HER-022", name="Llave Torx T27", category="Mecánica",
                        quantity_available=3, location="Taller - Estante A", condition="good",
                        description="Torx T27 para paneles y acceso interno del dispensador Gilbarco"),
            models.Tool(code="HER-023", name="Alicate de Puntas Largas", category="Mecánica",
                        quantity_available=3, location="Taller - Estante A", condition="good"),
            models.Tool(code="HER-024", name="Manómetro de Presión 0-15 bar", category="Diagnóstico",
                        quantity_available=2, location="Taller - Estante D", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180),
                        description="Para verificar presión de GLP en manguera y medidor"),
            models.Tool(code="HER-025", name="Torquímetro 1/4\" 5-25 Nm", category="Mecánica",
                        quantity_available=1, location="Taller - Estante B", condition="good",
                        requires_calibration=True, next_calibration=today + timedelta(days=180),
                        description="Para apretar conexiones de la medidora según torque de fábrica"),
        ]
        for t in tools:
            db.add(t)
        db.flush()

        # ─── INSUMOS Y CONSUMIBLES ────────────────────────────────────────────
        consumables = [
            # Caldera
            models.Consumable(code="INS-001", name="Agua Desmineralizada", category="Químicos",
                              unit="litros", stock_quantity=200, min_stock=100, max_stock=500,
                              unit_cost=1.20, supplier="AquaPura Industrial", location="Bodega Química",
                              description="Agua sin minerales para alimentación de caldera. Conductividad < 10 µS/cm"),
            models.Consumable(code="INS-002", name="Antiincrustante para Caldera", category="Químicos",
                              unit="kg", stock_quantity=15, min_stock=10, max_stock=40,
                              unit_cost=22.00, supplier="ChemTech Colombia", location="Bodega Química",
                              description="Previene incrustaciones en tubos y cuerpo de caldera"),
            models.Consumable(code="INS-003", name="Empaque de Grafito 1/8\" (Rollo)", category="Empaques",
                              unit="metros", stock_quantity=10, min_stock=5, max_stock=30,
                              unit_cost=8.50, supplier="Industrias Klingler", location="Bodega Mecánica",
                              description="Para válvulas, bridas y tapas de caldera hasta 400°C"),
            models.Consumable(code="INS-004", name="Silicona de Alta Temperatura (300°C)", category="Sellantes",
                              unit="unidad", stock_quantity=6, min_stock=4, max_stock=15,
                              unit_cost=12.00, supplier="Loctite", location="Bodega Mecánica",
                              description="Sellante para uniones de alta temperatura en caldera y tuberías de vapor"),
            models.Consumable(code="INS-005", name="Limpiador Desengrasante Industrial", category="Limpieza",
                              unit="litros", stock_quantity=20, min_stock=10, max_stock=50,
                              unit_cost=6.00, supplier="Arcanol Industrial", location="Bodega Química"),

            # Quemador
            models.Consumable(code="INS-006", name="Electrodo de Ignición Baltur TBG", category="Repuestos Menores",
                              unit="unidad", stock_quantity=4, min_stock=2, max_stock=10,
                              unit_cost=35.00, supplier="Baltur Colombia", location="Bodega Repuestos",
                              description="Electrodo de encendido original para quemador Baltur TBG 450 P"),
            models.Consumable(code="INS-007", name="Boquilla de Gas Baltur (Tobera)", category="Repuestos Menores",
                              unit="unidad", stock_quantity=2, min_stock=1, max_stock=5,
                              unit_cost=85.00, supplier="Baltur Colombia", location="Bodega Repuestos",
                              description="Tobera difusora de gas para ajuste de llama. Reemplazar cada 2 años"),
            models.Consumable(code="INS-008", name="Filtro de Gas para Quemador (10 micras)", category="Filtros",
                              unit="unidad", stock_quantity=5, min_stock=3, max_stock=12,
                              unit_cost=28.00, supplier="Parker Hannifin", location="Bodega Repuestos",
                              description="Filtra impurezas en la línea de gas antes del quemador"),
            models.Consumable(code="INS-009", name="Cinta de Teflón (Hilo de Sellado Gas)", category="Sellantes",
                              unit="rollo", stock_quantity=20, min_stock=10, max_stock=50,
                              unit_cost=2.50, supplier="Industrial Supply", location="Bodega Mecánica",
                              description="Para conexiones roscadas de gas. Densidad para gas: 3 vueltas mínimo"),
            models.Consumable(code="INS-010", name="Empaque de Goma Nitrilo NBR (Juego)", category="Empaques",
                              unit="juego", stock_quantity=6, min_stock=3, max_stock=15,
                              unit_cost=18.00, supplier="Parker Hannifin", location="Bodega Mecánica",
                              description="Empaques NBR resistentes a GLP y gas natural, temperatura hasta 120°C"),

            # Vaporizador
            models.Consumable(code="INS-011", name="Resistencia Eléctrica Vaporizador SDI 6kW", category="Repuestos Menores",
                              unit="unidad", stock_quantity=2, min_stock=1, max_stock=4,
                              unit_cost=320.00, supplier="Algas Technologies", location="Bodega Repuestos",
                              description="Resistencia de inmersión para baño de agua del vaporizador"),
            models.Consumable(code="INS-012", name="Inhibidor de Corrosión para Baño de Agua", category="Químicos",
                              unit="litros", stock_quantity=5, min_stock=3, max_stock=12,
                              unit_cost=18.00, supplier="ChemTech Colombia", location="Bodega Química",
                              description="Protege el intercambiador y cuerpo del vaporizador de la corrosión"),

            # Dispensador
            models.Consumable(code="INS-013", name="Empaque de Goma para Manguera GLP (Juego)", category="Empaques",
                              unit="juego", stock_quantity=10, min_stock=5, max_stock=25,
                              unit_cost=8.00, supplier="Gilbarco Parts", location="Bodega Repuestos",
                              description="Empaques de manguera surtidora de GLP. Reemplazar cada 6 meses"),
            models.Consumable(code="INS-014", name="Lubricante para Válvulas de GLP", category="Lubricantes",
                              unit="tarro", stock_quantity=4, min_stock=2, max_stock=10,
                              unit_cost=25.00, supplier="Molykote", location="Bodega Mecánica",
                              description="Grasa compatible con GLP y propano. No usar lubricante ordinario"),
            models.Consumable(code="INS-015", name="Filtro de Entrada GLP Dispensador", category="Filtros",
                              unit="unidad", stock_quantity=6, min_stock=3, max_stock=15,
                              unit_cost=32.00, supplier="Gilbarco Parts", location="Bodega Repuestos",
                              description="Filtra GLP líquido antes del medidor de caudal. Cambiar cada 6 meses"),
        ]
        for c in consumables:
            db.add(c)
        db.flush()

        # ─── PLANES DE MANTENIMIENTO ──────────────────────────────────────────

        # PLAN 1 — CALDERA: Mantenimiento Mensual
        plan_cal_mensual = models.MaintenancePlan(
            equipment_id=equipment_list[0].id,
            name="PM Mensual Caldera",
            type=models.MaintenanceType.preventive, frequency_days=30,
            estimated_duration_hours=6.0, next_scheduled=today + timedelta(days=10),
            description="Mantenimiento preventivo mensual. Limpieza de tubos de fuego, "
                        "análisis de agua y combustión, verificación de presiones y válvulas.",
            procedure=(
                "1. Apagar caldera y despresurizar completamente\n"
                "2. Verificar y registrar presión de trabajo antes de apagado\n"
                "3. Purgar condensado y lodos del tanque inferior\n"
                "4. Abrir registro de inspección y revisar tubos de fuego con linterna\n"
                "5. Limpiar tubos con cepillo cilíndrico\n"
                "6. Inspeccionar quemador (ver plan quemador)\n"
                "7. Revisar y ajustar válvulas de seguridad\n"
                "8. Verificar nivel y calidad del agua de caldera (pH 10-11)\n"
                "9. Dosificar antiincrustante según resultado de análisis\n"
                "10. Encender y verificar combustión con analizador de gases\n"
                "11. Registrar todos los parámetros en bitácora"
            ),
            safety_notes=(
                "PELIGRO: Equipo a presión. DESPRESURIZAR COMPLETAMENTE antes de abrir.\n"
                "EPP obligatorio: careta, guantes de cuero, botas punta de acero.\n"
                "Verificar cero presión en manómetro antes de retirar tapas.\n"
                "Tener extintor CO2 cercano durante encendido."
            ),
        )
        db.add(plan_cal_mensual)
        db.flush()
        # Herramientas del plan caldera mensual
        for tid, qty in [(tools[0].id, 1), (tools[1].id, 1), (tools[2].id, 1),
                         (tools[3].id, 1), (tools[4].id, 1), (tools[5].id, 1),
                         (tools[7].id, 2), (tools[8].id, 1), (tools[9].id, 1)]:
            db.add(models.PlanTool(plan_id=plan_cal_mensual.id, tool_id=tid, quantity=qty))
        # Insumos del plan caldera mensual
        for cid, qty in [(consumables[0].id, 50), (consumables[1].id, 2),
                         (consumables[2].id, 1), (consumables[4].id, 2)]:
            db.add(models.PlanConsumable(plan_id=plan_cal_mensual.id, consumable_id=cid, quantity=qty))
        # Checklist caldera
        for i, (desc, cat) in enumerate([
            ("Despresurizar y verificar presión cero en manómetro", "safety"),
            ("Usar EPP completo: careta, guantes cuero, botas acero", "safety"),
            ("Purgar condensado del tanque inferior", "procedure"),
            ("Inspeccionar tubos de fuego con linterna - registrar estado", "procedure"),
            ("Limpiar tubos internamente con cepillo cilíndrico", "procedure"),
            ("Tomar muestra de agua y medir pH (debe ser 10-11)", "quality"),
            ("Dosificar antiincrustante según análisis de agua", "procedure"),
            ("Verificar estado y apertura de válvulas de seguridad", "procedure"),
            ("Encender caldera y analizar gases de combustión", "procedure"),
            ("CO2 entre 9-11%, O2 entre 3-5%, temperatura gases max 250°C", "quality"),
            ("Registrar todos los parámetros en bitácora de caldera", "quality"),
        ]):
            db.add(models.ChecklistItem(plan_id=plan_cal_mensual.id, description=desc, category=cat, order=i, is_required=True))

        # PLAN 2 — CALDERA: Prueba Hidrostática Anual
        plan_cal_anual = models.MaintenancePlan(
            equipment_id=equipment_list[0].id,
            name="Prueba Hidrostática Anual Caldera",
            type=models.MaintenanceType.inspection, frequency_days=365,
            estimated_duration_hours=12.0, next_scheduled=today + timedelta(days=180),
            description="Prueba hidrostática anual requerida por norma. Presión de prueba = 1.5 x presión de diseño (225 PSI).",
            safety_notes="Solo personal certificado. Notificar a entidad inspectora certificada (ICONTEC/SGS).",
        )
        db.add(plan_cal_anual)
        db.flush()
        for tid, qty in [(tools[6].id, 1), (tools[5].id, 2), (tools[0].id, 1), (tools[8].id, 1)]:
            db.add(models.PlanTool(plan_id=plan_cal_anual.id, tool_id=tid, quantity=qty))
        for cid, qty in [(consumables[2].id, 2), (consumables[3].id, 2)]:
            db.add(models.PlanConsumable(plan_id=plan_cal_anual.id, consumable_id=cid, quantity=qty))

        # PLAN 3 — QUEMADOR: Mantenimiento Bimestral
        plan_que_bimestral = models.MaintenancePlan(
            equipment_id=equipment_list[1].id,
            name="PM Bimestral Quemador",
            type=models.MaintenanceType.preventive, frequency_days=60,
            estimated_duration_hours=4.0, next_scheduled=today + timedelta(days=25),
            description="Limpieza y ajuste del quemador Baltur TBG 450 P. "
                        "Verificación de electrodo, boquilla, fotocélula y sistema de control.",
            procedure=(
                "1. Apagar caldera y esperar enfriamiento mínimo 30 min\n"
                "2. Cerrar válvula de gas manual antes del quemador\n"
                "3. Retirar panel frontal con llave Torx T25\n"
                "4. Desconectar manguera de gas de la rampa con llave 12\"\n"
                "5. Desmontar cabezal de combustión con llave Torx T30\n"
                "6. Limpiar difusor y paletas con pistola de aire y trapo\n"
                "7. Inspeccionar electrodo de ignición - medir gap (3-4mm) - reemplazar si desgastado\n"
                "8. Limpiar lente de fotocélula con paño seco\n"
                "9. Reemplazar boquilla de gas si tiene depósitos o deformación\n"
                "10. Verificar filtro de gas - reemplazar si está saturado\n"
                "11. Revisar y limpiar ventilador de combustión con pistola de aire\n"
                "12. Rearmar con torque correcto usando llaves Torx\n"
                "13. Abrir gas, verificar ausencia de fugas con detector electrónico\n"
                "14. Encender y ajustar relación aire-gas con analizador de combustión\n"
                "15. CO máx: 50 ppm, CO2: 9-11%, eficiencia > 88%"
            ),
            safety_notes=(
                "PELIGRO GAS: Verificar ausencia de fugas ANTES de encender.\n"
                "No encender si hay olor a gas en el área.\n"
                "Mantener zona ventilada durante mantenimiento.\n"
                "Detector de fugas en mano durante reconexión de gas."
            ),
        )
        db.add(plan_que_bimestral)
        db.flush()
        # Herramientas quemador
        for tid, qty in [(tools[10].id, 2), (tools[11].id, 2), (tools[12].id, 2),
                         (tools[13].id, 1), (tools[14].id, 1), (tools[15].id, 1),
                         (tools[16].id, 1), (tools[17].id, 1), (tools[1].id, 1),
                         (tools[9].id, 1)]:
            db.add(models.PlanTool(plan_id=plan_que_bimestral.id, tool_id=tid, quantity=qty))
        # Insumos quemador
        for cid, qty in [(consumables[5].id, 1), (consumables[6].id, 1),
                         (consumables[7].id, 1), (consumables[8].id, 3),
                         (consumables[4].id, 1)]:
            db.add(models.PlanConsumable(plan_id=plan_que_bimestral.id, consumable_id=cid, quantity=qty))
        # Checklist quemador
        for i, (desc, cat) in enumerate([
            ("Cerrar válvula de gas manual antes del quemador", "safety"),
            ("Verificar ausencia de gas residual con detector electrónico", "safety"),
            ("Retirar panel frontal con Torx T25 sin dañar cableado", "procedure"),
            ("Inspeccionar electrodo - gap debe ser 3-4mm", "quality"),
            ("Limpiar difusor y paletas con aire comprimido", "procedure"),
            ("Limpiar lente de fotocélula con paño seco", "procedure"),
            ("Verificar estado de boquilla de gas - reemplazar si necesario", "procedure"),
            ("Revisar filtro de gas - registrar estado (limpio/sucio/cambiado)", "quality"),
            ("Verificar fugas en todas las conexiones de gas reconectadas", "safety"),
            ("Medir CO en gases de escape (máx 50 ppm)", "quality"),
            ("Eficiencia de combustión mayor al 88%", "quality"),
        ]):
            db.add(models.ChecklistItem(plan_id=plan_que_bimestral.id, description=desc, category=cat, order=i, is_required=True))

        # PLAN 4 — VAPORIZADOR: Mantenimiento Trimestral
        plan_vap_trimestral = models.MaintenancePlan(
            equipment_id=equipment_list[2].id,
            name="PM Trimestral Vaporizador",
            type=models.MaintenanceType.preventive, frequency_days=90,
            estimated_duration_hours=5.0, next_scheduled=today + timedelta(days=45),
            description="Revisión completa del vaporizador eléctrico: resistencias, "
                        "intercambiador, controles de temperatura y sistema de seguridad.",
            procedure=(
                "1. Aislar eléctricamente (bloquear breaker con candado LOTO)\n"
                "2. Cerrar válvula de entrada de GLP líquido\n"
                "3. Despresurizar vaporizador abriendo válvula de venteo\n"
                "4. Medir resistencia de las resistencias eléctricas con multímetro\n"
                "5. Verificar temperatura del baño de agua con termómetro infrarrojo\n"
                "6. Inspeccionar intercambiador de calor - revisar incrustaciones\n"
                "7. Agregar inhibidor de corrosión al baño de agua\n"
                "8. Limpiar filtro de entrada con pistola de aire\n"
                "9. Verificar funcionamiento de termostato de seguridad\n"
                "10. Revisar sellos y empaques de todas las conexiones\n"
                "11. Verificar fugas con detector electrónico al restaurar servicio\n"
                "12. Registrar caudal de salida y presión"
            ),
            safety_notes=(
                "PELIGRO ELÉCTRICO + GAS: Procedimiento LOTO obligatorio.\n"
                "Bloquear breaker y colocar tarjeta de seguridad antes de intervenir.\n"
                "El GLP puede acumularse en zonas bajas - ventilar el área."
            ),
        )
        db.add(plan_vap_trimestral)
        db.flush()
        for tid, qty in [(tools[18].id, 1), (tools[19].id, 1), (tools[14].id, 1),
                         (tools[20].id, 1), (tools[13].id, 1), (tools[17].id, 1),
                         (tools[9].id, 1)]:
            db.add(models.PlanTool(plan_id=plan_vap_trimestral.id, tool_id=tid, quantity=qty))
        for cid, qty in [(consumables[9].id, 1), (consumables[11].id, 1), (consumables[8].id, 2)]:
            db.add(models.PlanConsumable(plan_id=plan_vap_trimestral.id, consumable_id=cid, quantity=qty))

        # PLAN 5 — DISPENSADOR: Mantenimiento Semestral
        plan_dis_semestral = models.MaintenancePlan(
            equipment_id=equipment_list[3].id,
            name="PM Semestral Dispensador GLP",
            type=models.MaintenanceType.preventive, frequency_days=180,
            estimated_duration_hours=3.0, next_scheduled=today + timedelta(days=30),
            description="Mantenimiento semestral del dispensador: manguera, medidor, "
                        "válvulas, filtro y sistema de medición fiscal.",
            procedure=(
                "1. Cerrar válvula de suministro de GLP al dispensador\n"
                "2. Retirar paneles laterales con Torx T27\n"
                "3. Inspeccionar manguera surtidora - verificar sin grietas ni ampollas\n"
                "4. Reemplazar empaques de manguera (siempre en cada mantenimiento)\n"
                "5. Revisar y limpiar filtro de entrada - reemplazar si necesario\n"
                "6. Lubricar válvula de corte con lubricante compatible con GLP\n"
                "7. Verificar ajuste mecánico del medidor con torquímetro (según ficha técnica)\n"
                "8. Inspeccionar bornera eléctrica del display y totalizador\n"
                "9. Abrir suministro y verificar fugas con detector electrónico\n"
                "10. Hacer prueba de despacho y verificar exactitud del medidor\n"
                "11. Sellar paneles y registrar en bitácora"
            ),
            safety_notes=(
                "PELIGRO GLP: El GLP es más pesado que el aire y se acumula en zonas bajas.\n"
                "No fumar ni usar llama abierta en el área.\n"
                "Tener extintor CO2 a menos de 5 metros.\n"
                "Usar detector de fugas antes de abrir cualquier conexión."
            ),
        )
        db.add(plan_dis_semestral)
        db.flush()
        for tid, qty in [(tools[21].id, 2), (tools[22].id, 1), (tools[23].id, 1),
                         (tools[24].id, 1), (tools[13].id, 1), (tools[9].id, 1),
                         (tools[17].id, 1)]:
            db.add(models.PlanTool(plan_id=plan_dis_semestral.id, tool_id=tid, quantity=qty))
        for cid, qty in [(consumables[12].id, 1), (consumables[13].id, 1),
                         (consumables[14].id, 1), (consumables[8].id, 3)]:
            db.add(models.PlanConsumable(plan_id=plan_dis_semestral.id, consumable_id=cid, quantity=qty))
        # Checklist dispensador
        for i, (desc, cat) in enumerate([
            ("Cerrar válvula de suministro GLP antes de intervenir", "safety"),
            ("Verificar ausencia de fuga antes de retirar paneles", "safety"),
            ("Inspeccionar manguera: sin grietas, ampollas ni deformaciones", "quality"),
            ("Reemplazar empaques de manguera (siempre en cada PM)", "procedure"),
            ("Reemplazar filtro de entrada GLP", "procedure"),
            ("Lubricar válvula de corte con lubricante compatible GLP", "procedure"),
            ("Verificar fugas en todas las conexiones al restaurar servicio", "safety"),
            ("Hacer prueba de despacho y verificar exactitud del medidor", "quality"),
        ]):
            db.add(models.ChecklistItem(plan_id=plan_dis_semestral.id, description=desc, category=cat, order=i, is_required=True))

        # ─── ÓRDENES DE TRABAJO ───────────────────────────────────────────────
        wo1 = models.WorkOrder(
            order_number="OT-2024-0001", equipment_id=equipment_list[0].id,
            plan_id=plan_cal_mensual.id, type=models.MaintenanceType.preventive,
            priority=models.WorkOrderPriority.high, status=models.WorkOrderStatus.pending,
            scheduled_date=today + timedelta(days=10), technician_id=users[2].id,
            supervisor_id=users[1].id,
            description="PM Mensual Caldera - Limpieza tubos, análisis agua y combustión",
        )
        db.add(wo1)

        wo2 = models.WorkOrder(
            order_number="OT-2024-0002", equipment_id=equipment_list[1].id,
            plan_id=plan_que_bimestral.id, type=models.MaintenanceType.preventive,
            priority=models.WorkOrderPriority.medium, status=models.WorkOrderStatus.pending,
            scheduled_date=today + timedelta(days=25), technician_id=users[3].id,
            supervisor_id=users[1].id,
            description="PM Bimestral Quemador Baltur - Limpieza electrodo, boquilla y fotocélula",
        )
        db.add(wo2)

        wo3 = models.WorkOrder(
            order_number="OT-2024-0003", equipment_id=equipment_list[3].id,
            type=models.MaintenanceType.corrective, priority=models.WorkOrderPriority.high,
            status=models.WorkOrderStatus.in_progress,
            scheduled_date=today, technician_id=users[3].id, supervisor_id=users[1].id,
            description="Dispensador reporta goteo en manguera surtidora - revisión urgente empaque",
            start_datetime=datetime.now(timezone.utc),
        )
        db.add(wo3)

        wo4 = models.WorkOrder(
            order_number="OT-2024-0004", equipment_id=equipment_list[2].id,
            plan_id=plan_vap_trimestral.id, type=models.MaintenanceType.preventive,
            priority=models.WorkOrderPriority.medium, status=models.WorkOrderStatus.pending,
            scheduled_date=today + timedelta(days=45), technician_id=users[4].id,
            supervisor_id=users[1].id,
            description="PM Trimestral Vaporizador - Revisión resistencias y baño de agua",
        )
        db.add(wo4)

        # ─── HOJA DE VIDA (LIFECYCLE) ─────────────────────────────────────────
        lifecycle_entries = [
            models.EquipmentLifecycle(
                equipment_id=equipment_list[0].id,
                date=datetime(today.year, today.month, max(today.day - 20, 1), 8, 0, tzinfo=timezone.utc),
                event_type=models.MaintenanceType.preventive,
                description="PM Mensual Caldera - Rutina completa",
                findings="Tubos de fuego con depósito leve de hollín. pH agua: 10.2 (OK). "
                         "Análisis combustión: CO2 10.1%, O2 4.2%, eficiencia 86%. "
                         "Válvula de seguridad funcionando correctamente.",
                actions_taken="Limpieza de tubos con cepillo cilíndrico. Dosificación de 2 kg antiincrustante. "
                              "Purga de lodos tanque inferior. Ajuste de presostatos. "
                              "Reemplazo empaque de grafito en tapa de registro.",
                technician_id=users[2].id, labor_hours=5.5, total_cost=185.00,
                equipment_status_before=models.EquipmentStatus.active,
                equipment_status_after=models.EquipmentStatus.active,
            ),
            models.EquipmentLifecycle(
                equipment_id=equipment_list[1].id,
                date=datetime(today.year, today.month, max(today.day - 35, 1), 9, 0, tzinfo=timezone.utc),
                event_type=models.MaintenanceType.preventive,
                description="PM Bimestral Quemador Baltur TBG 450 P",
                findings="Electrodo de ignición con gap de 2mm (ajustado a 3.5mm). "
                         "Fotocélula con depósito leve de carbón. "
                         "Boquilla en buen estado. Filtro de gas con 40% de saturación.",
                actions_taken="Ajuste gap electrodo. Limpieza fotocélula. "
                              "Limpieza difusor y paletas con aire comprimido. "
                              "Análisis combustión ajustado: CO2=10.3%, CO=12ppm, eficiencia=89.5%",
                technician_id=users[3].id, labor_hours=3.5, total_cost=120.00,
                equipment_status_before=models.EquipmentStatus.active,
                equipment_status_after=models.EquipmentStatus.active,
            ),
        ]
        for entry in lifecycle_entries:
            db.add(entry)

        db.commit()

        # ─── COMPARADOR DE PRECIOS ──────────────────────────────────────────
        price_categories = [
            models.PriceCategory(name="Repuestos Industriales", icon="cog"),
            models.PriceCategory(name="Herramientas", icon="wrench"),
            models.PriceCategory(name="Insumos y Consumibles", icon="package"),
            models.PriceCategory(name="Instrumentos de Medición", icon="gauge"),
        ]
        for c in price_categories:
            db.add(c)
        db.commit()

        stores = [
            models.Store(name="MercadoLibre", store_type=models.StoreType.hybrid,
                         website_url="https://www.mercadolibre.com", reputation_rating=4.4,
                         reputation_reviews_count=185000),
            models.Store(name="Amazon", store_type=models.StoreType.online,
                         website_url="https://www.amazon.com", reputation_rating=4.6,
                         reputation_reviews_count=520000),
            models.Store(name="AliExpress", store_type=models.StoreType.online,
                         website_url="https://www.aliexpress.com", reputation_rating=4.1,
                         reputation_reviews_count=98000),
            models.Store(name="Falabella", store_type=models.StoreType.hybrid,
                         website_url="https://www.falabella.com", reputation_rating=4.2,
                         reputation_reviews_count=32000),
            models.Store(name="Ferretería Industrial El Tornillo", store_type=models.StoreType.physical,
                         website_url="https://www.eltornillo.com", reputation_rating=4.7,
                         reputation_reviews_count=1200),
        ]
        for s in stores:
            db.add(s)
        db.commit()

        products = [
            models.Product(name="Multímetro Digital Fluke 117", category_id=price_categories[3].id,
                            brand="Fluke", sku="FLK-117",
                            description="Multímetro digital True RMS para electricistas, con detección de tensión sin contacto.",
                            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400"),
            models.Product(name="Juego de Llaves Combinadas 8-19mm", category_id=price_categories[1].id,
                            brand="Stanley", sku="STN-KIT8-19",
                            description="Set de 8 llaves combinadas cromo-vanadio, tamaños 8mm a 19mm.",
                            image_url="https://images.unsplash.com/photo-1581147036324-c1c8e04a4b6a?w=400"),
            models.Product(name="Rodamiento SKF 6205-2RS", category_id=price_categories[0].id,
                           brand="SKF", sku="SKF-6205-2RS",
                            description="Rodamiento rígido de bolas sellado, 25x52x15mm.",
                            image_url="https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400"),
            models.Product(name="Grasa Industrial Multiuso 400g", category_id=price_categories[2].id,
                            brand="Mobil", sku="MBL-GR400",
                            description="Grasa lubricante multiuso de litio para rodamientos y componentes mecánicos.",
                            image_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"),
        ]
        for p in products:
            db.add(p)
        db.commit()

        offers = [
            # Multímetro Fluke 117
            models.ProductOffer(product_id=products[0].id, store_id=stores[1].id, price=289.99, currency="USD",
                                 product_url="https://www.amazon.com/dp/B00APFXFHY", in_stock=True),
            models.ProductOffer(product_id=products[0].id, store_id=stores[0].id, price=265.50, currency="USD",
                                 seller_name="ElectroImportadora CO", product_url="https://articulo.mercadolibre.com.co/MCO-fluke-117",
                                 in_stock=True, reputation_rating=4.6, reputation_reviews_count=3400),
            models.ProductOffer(product_id=products[0].id, store_id=stores[3].id, price=310.00, currency="USD",
                                 product_url="https://www.falabella.com/falabella-cl/product/fluke-117", in_stock=False),

            # Juego de llaves Stanley
            models.ProductOffer(product_id=products[1].id, store_id=stores[2].id, price=34.90, currency="USD",
                                 seller_name="Global Tools Store", product_url="https://www.aliexpress.com/item/stanley-kit8-19",
                                 in_stock=True, reputation_rating=4.3, reputation_reviews_count=15200),
            models.ProductOffer(product_id=products[1].id, store_id=stores[0].id, price=42.75, currency="USD",
                                 seller_name="Herramientas del Valle", product_url="https://articulo.mercadolibre.com.co/MCO-stanley-kit8-19",
                                 in_stock=True, reputation_rating=4.5, reputation_reviews_count=890),
            models.ProductOffer(product_id=products[1].id, store_id=stores[4].id, price=45.00, currency="USD",
                                 product_url="https://www.eltornillo.com/producto/stanley-kit8-19", in_stock=True),

            # Rodamiento SKF
            models.ProductOffer(product_id=products[2].id, store_id=stores[4].id, price=12.50, currency="USD",
                                 product_url="https://www.eltornillo.com/producto/skf-6205-2rs", in_stock=True),
            models.ProductOffer(product_id=products[2].id, store_id=stores[2].id, price=9.80, currency="USD",
                                 seller_name="Bearing World", product_url="https://www.aliexpress.com/item/skf-6205-2rs",
                                 in_stock=True, reputation_rating=4.0, reputation_reviews_count=6700),
            models.ProductOffer(product_id=products[2].id, store_id=stores[1].id, price=15.99, currency="USD",
                                 product_url="https://www.amazon.com/dp/skf-6205-2rs", in_stock=True),

            # Grasa Mobil
            models.ProductOffer(product_id=products[3].id, store_id=stores[3].id, price=8.90, currency="USD",
                                 product_url="https://www.falabella.com/falabella-cl/product/mobil-grasa-400g", in_stock=True),
            models.ProductOffer(product_id=products[3].id, store_id=stores[0].id, price=7.60, currency="USD",
                                 seller_name="Lubricantes Industriales SAS", product_url="https://articulo.mercadolibre.com.co/MCO-mobil-grasa-400g",
                                 in_stock=True, reputation_rating=4.8, reputation_reviews_count=2100),
        ]
        for o in offers:
            db.add(o)
        db.commit()

        print("\n=== DATOS CARGADOS EXITOSAMENTE ===\n")
        print("EQUIPOS:")
        print("  CAL-001 - Caldera Pirotubular Cleaver Brooks 200 BHP")
        print("  QUE-001 - Quemador Baltur TBG 450 P")
        print("  VAP-001 - Vaporizador Eléctrico Algas SDI-500")
        print("  DIS-001 - Dispensador GLP Gilbarco E700")
        print("\nHERRAMIENTAS: 25 herramientas cargadas")
        print("INSUMOS: 15 insumos/consumibles cargados")
        print("PLANES: 5 planes de mantenimiento con herramientas e insumos asignados")
        print("COMPARADOR DE PRECIOS: 4 productos, 5 tiendas, 11 ofertas cargadas")
        print("\nUSUARIOS:")
        print("  admin / admin123       -> Administrador")
        print("  supervisor1 / super123 -> Supervisor")
        print("  tecnico1 / tec123      -> Tecnico (Gas/Calderas)")
        print("  tecnico2 / tec123      -> Tecnico (Quemadores/Electrica)")
        print("  tecnico3 / tec123      -> Tecnico (Soldadura/Vaporizadores)")
        print("  visor1 / ver123        -> Visor")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
