import JSZip from 'jszip';

export async function buildLaravelProjectZip(): Promise<Buffer> {
  const zip = new JSZip();
  const root = zip.folder('acerocal-laravel-11')!;

  // 1. Root configuration files
  root.file(
    'composer.json',
    JSON.stringify(
      {
        name: 'acerocal/sistema-ventas-calaminas',
        type: 'project',
        description:
          'ACEROCAL - Sistema integral Laravel 11 para fábrica y venta de calaminas, bobinas, corte a medida y Pago QR BNB.',
        license: 'MIT',
        require: {
          php: '^8.2',
          'laravel/framework': '^11.0',
          'laravel/sanctum': '^4.0',
          'simplesoftwareio/simple-qrcode': '^4.2',
        },
        'require-dev': {
          'fakerphp/faker': '^1.23',
          'laravel/pint': '^1.13',
          'phpunit/phpunit': '^11.0',
        },
        autoload: {
          'psr-4': {
            'App\\': 'app/',
            'Database\\Factories\\': 'database/factories/',
            'Database\\Seeders\\': 'database/seeders/',
          },
        },
        scripts: {
          'post-autoload-dump': [
            'Illuminate\\Foundation\\ComposerScripts::postAutoloadDump',
            '@php artisan package:discover --ansi',
          ],
        },
        'minimum-stability': 'stable',
        'prefer-stable': true,
      },
      null,
      2
    )
  );

  root.file(
    'package.json',
    JSON.stringify(
      {
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
        },
        devDependencies: {
          '@tailwindcss/vite': '^4.0.0',
          axios: '^1.7.4',
          tailwindcss: '^4.0.0',
          vite: '^6.0.0',
          'laravel-vite-plugin': '^1.2.0',
        },
      },
      null,
      2
    )
  );

  root.file(
    '.env.example',
    `APP_NAME="ACEROCAL Fábrica de Calaminas"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=America/La_Paz
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=acerocal_calaminas
DB_USERNAME=root
DB_PASSWORD=

# Para usar SQLite en pruebas rápidas:
# DB_CONNECTION=sqlite

SESSION_DRIVER=database
SESSION_LIFETIME=10080

# Banco Nacional de Bolivia - Open Banking QR Simple V2
BNB_MODE=SIMULADOR
BNB_BASE_URL=http://test.bnb.com.bo
BNB_ACCOUNT_ID=
BNB_AUTHORIZATION_ID=
BNB_DESTINATION_ACCOUNT_ID=1
BNB_WEBHOOK_SECRET=
`
  );

  root.file(
    'vite.config.js',
    `import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
`
  );

  root.file(
    'README.md',
    `# ACEROCAL — Sistema de Ventas para Fábrica de Calaminas (Laravel 11)

Proyecto completo en **Laravel 11 + Blade + Tailwind CSS + MySQL/SQLite** adaptado para fábricas y comercializadoras de calaminas en Bolivia.

## Módulos Incluidos
1. **Login Industrial & Configurador Inicial**: Acceso con roles (\`ADMIN\`, \`VENDEDOR\`, \`OPERADOR_CORTE\`, \`ALMACENERO\`).
2. **Tablero Principal**: Rendimiento configurable por período (Hoy, Semana, Mes, Bimestre, Trimestre, Año) y stock por línea de calamina.
3. **Mostrador POS & Cotizador a Medida**:
   - Perfiles: Ondulada, Trapezoidal T101, Teja Española, Policarbonato Traslúcido, Panel Termoacústico PUR, Cumbreras, Perfiles C y Tornillos EPDM.
   - **13 Colores RAL / Acabados** y **Calibres 24–32**.
   - **Calculadora de Techo** (incluye opción automática de láminas traslúcidas, cumbreras y tornillos) y **Simulador Visual de Techo SVG**.
   - Retiro en Planta vs Envío a Obra, Descuento Mayorista 5% y Proformas.
4. **Órdenes de Corte en Roladora**: Cola de producción (\`PENDIENTE\`, \`EN_ROLADORA\`, \`LISTO\`, \`ENTREGADO\`).
5. **Almacén Multi-Sucursal y Bobinas Madre**: Control por metro lineal, bobinas por color RAL y traspasos entre sucursales.
6. **Pago QR Simple BNB Open Banking V2**:
   - \`BnbQrService\` completo con Servicios 5–10 (\`auth/token\`, \`UpdateCredentials\`, \`getQRWithImageAsync\`, \`getQRStatusAsync\`, \`CancelQRByIdAsync\`) y webhook \`POST /api/bnb/ReceiveNotification\`.
   - Incluye modo **SIMULADOR** local listo para pruebas sin credenciales bancarias.
7. **Arqueo de Caja, Historial con Despacho y Seguridad / Auditoría**.

## Instalación Rápida
\`\`\`bash
composer install
cp .env.example .env
php artisan key:generate
# Configura tu base de datos MySQL o usa SQLite (touch database/database.sqlite)
php artisan migrate --seed
npm install && npm run build
php artisan serve
\`\`\`

Credenciales iniciales sembradas por \`AcerocalSeeder\`:
- **Usuario**: \`admin\`
- **Clave**: \`acerocal2026\` (cámbiala al iniciar en producción).

## Despliegue en Vercel (PHP Runtime)
Este paquete incluye \`vercel.json\` y \`api/index.php\` configurados con \`vercel-php\`:
1. Sube la carpeta a GitHub / GitLab o ejecuta \`vercel\`.
2. Configura las variables de entorno en Vercel (\`APP_KEY\`, \`DB_CONNECTION\`, \`DB_HOST\`, \`DB_DATABASE\`, \`DB_USERNAME\`, \`DB_PASSWORD\`, \`VIEW_COMPILED_PATH=/tmp\`, \`APP_SERVICES_CACHE=/tmp/services.php\`, \`APP_PACKAGES_CACHE=/tmp/packages.php\`, \`APP_CONFIG_CACHE=/tmp/config.php\`, \`APP_ROUTES_CACHE=/tmp/routes.php\`).
3. Ejecuta \`npm run build\` como Build Command (ya configurado en \`vercel.json\`).
`
  );

  root.file(
    'vercel.json',
    JSON.stringify(
      {
        version: 2,
        framework: null,
        functions: {
          'api/index.php': {
            runtime: 'vercel-php@0.7.2',
          },
        },
        routes: [
          { src: '/build/(.*)', dest: '/public/build/$1' },
          { src: '/(.*)', dest: '/api/index.php' },
        ],
        env: {
          APP_ENV: 'production',
          APP_DEBUG: 'false',
          APP_CONFIG_CACHE: '/tmp/config.php',
          APP_EVENTS_CACHE: '/tmp/events.php',
          APP_PACKAGES_CACHE: '/tmp/packages.php',
          APP_ROUTES_CACHE: '/tmp/routes.php',
          APP_SERVICES_CACHE: '/tmp/services.php',
          VIEW_COMPILED_PATH: '/tmp',
          CACHE_STORE: 'array',
          LOG_CHANNEL: 'stderr',
          SESSION_DRIVER: 'cookie',
        },
      },
      null,
      2
    )
  );

  root.file(
    'api/index.php',
    `<?php

// Entrypoint serverless de Laravel 11 para Vercel
require __DIR__ . '/../public/index.php';
`
  );

  // 2. Config files
  root.file(
    'config/bnb.php',
    `<?php

return [
    'mode' => env('BNB_MODE', 'SIMULADOR'),
    'base_url' => rtrim(env('BNB_BASE_URL', 'http://test.bnb.com.bo'), '/'),
    'account_id' => env('BNB_ACCOUNT_ID', ''),
    'authorization_id' => env('BNB_AUTHORIZATION_ID', ''),
    'destination_account_id' => env('BNB_DESTINATION_ACCOUNT_ID', '1'),
    'webhook_secret' => env('BNB_WEBHOOK_SECRET', ''),
];
`
  );

  // 3. Migrations
  root.file(
    'database/migrations/2026_01_01_000001_create_branches_and_users_table.php',
    `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->string('city');
            $table->string('address');
            $table->boolean('is_factory')->default(false);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 60)->unique();
            $table->string('full_name');
            $table->enum('role', ['ADMIN', 'VENDEDOR', 'OPERADOR_CORTE', 'ALMACENERO'])->default('VENDEDOR');
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('password');
            $table->boolean('active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('branches');
    }
};
`
  );

  root.file(
    'database/migrations/2026_01_01_000002_create_calamina_catalog_tables.php',
    `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 40)->unique();
            $table->string('name');
            $table->enum('profile_type', [
                'ONDULADA',
                'TRAPEZOIDAL',
                'TEJA_ESPANOLA',
                'TRASLUCIDA',
                'PANEL_TERMICO',
                'CUMBRERA',
                'PERFIL',
                'ACCESORIO',
            ]);
            $table->text('description')->nullable();
            $table->decimal('useful_width_m', 5, 2)->default(0.80);
            $table->decimal('total_width_m', 5, 2)->default(1.00);
            $table->string('wave_or_step_info')->nullable();
            $table->decimal('base_price_per_meter', 10, 2);
            $table->boolean('cuttable')->default(true);
            $table->string('unit_label', 20)->default('ml');
            $table->decimal('min_length_m', 5, 2)->default(1.00);
            $table->decimal('max_length_m', 5, 2)->default(12.00);
            $table->decimal('default_length_m', 5, 2)->default(3.00);
            $table->json('available_colors');
            $table->json('available_gauges');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('branch_product_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('stock_quantity', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['branch_id', 'product_id']);
        });

        Schema::create('coils', function (Blueprint $table) {
            $table->id();
            $table->string('coil_code', 40)->unique();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('color_code', 20);
            $table->string('gauge', 10);
            $table->integer('width_mm')->default(1200);
            $table->decimal('initial_meters', 10, 2);
            $table->decimal('remaining_meters', 10, 2);
            $table->decimal('weight_kg', 10, 2);
            $table->string('supplier');
            $table->string('lot_number');
            $table->enum('status', ['DISPONIBLE', 'EN_MAQUINA', 'AGOTADA'])->default('DISPONIBLE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coils');
        Schema::dropIfExists('branch_product_stocks');
        Schema::dropIfExists('products');
    }
};
`
  );

  root.file(
    'database/migrations/2026_01_01_000003_create_clients_and_sales_tables.php',
    `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('nit_ci', 30)->default('0');
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->enum('type', ['PARTICULAR', 'CONSTRUCTORA', 'FERRETERIA', 'ESTANCIA'])->default('PARTICULAR');
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('current_debt', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 30)->unique();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('client_id')->constrained('clients');
            $table->decimal('total_linear_meters', 10, 2)->default(0);
            $table->decimal('total_area_sqm', 10, 2)->default(0);
            $table->decimal('total_weight_kg', 10, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('freight_cost', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('payment_method', ['EFECTIVO', 'QR_BNB', 'MIXTO', 'CREDITO']);
            $table->decimal('cash_paid', 12, 2)->default(0);
            $table->decimal('qr_paid', 12, 2)->default(0);
            $table->decimal('credit_amount', 12, 2)->default(0);
            $table->enum('status', ['COMPLETADA', 'ANULADA', 'PENDIENTE_QR'])->default('COMPLETADA');
            $table->enum('delivery_type', ['RETIRO_PLANTA', 'ENVIO_OBRA'])->default('RETIRO_PLANTA');
            $table->enum('dispatch_status', ['EN_PLANTA', 'CARGANDO_CAMION', 'EN_RUTA', 'ENTREGADO'])->default('EN_PLANTA');
            $table->string('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->string('sku', 40);
            $table->string('product_name');
            $table->string('profile_type', 30);
            $table->boolean('cuttable')->default(true);
            $table->string('color_code', 20);
            $table->string('color_name', 60);
            $table->string('color_hex', 20);
            $table->string('gauge', 10);
            $table->decimal('length_meters', 8, 2);
            $table->integer('quantity');
            $table->decimal('total_linear_meters', 10, 2);
            $table->decimal('area_sqm', 10, 2);
            $table->decimal('weight_kg', 10, 2);
            $table->decimal('price_per_meter', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 12, 2);
            $table->string('cut_note')->nullable();
            $table->timestamps();
        });

        Schema::create('proformas', function (Blueprint $table) {
            $table->id();
            $table->string('proforma_number', 30)->unique();
            $table->date('valid_until');
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('client_id')->constrained('clients');
            $table->json('items');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('freight_cost', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('status', ['VIGENTE', 'CONVERTIDA', 'EXPIRADA'])->default('VIGENTE');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proformas');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('clients');
    }
};
`
  );

  root.file(
    'database/migrations/2026_01_01_000004_create_cut_orders_and_transfers_tables.php',
    `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cut_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('client_name');
            $table->enum('status', ['PENDIENTE', 'EN_ROLADORA', 'LISTO', 'ENTREGADO'])->default('PENDIENTE');
            $table->string('machine');
            $table->enum('priority', ['NORMAL', 'URGENTE'])->default('NORMAL');
            $table->json('items');
            $table->decimal('total_meters', 10, 2);
            $table->string('operator_assigned')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number', 30)->unique();
            $table->foreignId('from_branch_id')->constrained('branches');
            $table->foreignId('to_branch_id')->constrained('branches');
            $table->foreignId('product_id')->constrained('products');
            $table->string('color_code', 20);
            $table->string('gauge', 10);
            $table->decimal('quantity_meters_or_units', 10, 2);
            $table->string('requested_by');
            $table->enum('status', ['COMPLETADO', 'EN_TRANSITO'])->default('COMPLETADO');
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            $table->string('supplier');
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('description');
            $table->string('color_code', 20);
            $table->string('gauge', 10);
            $table->decimal('meters_bought', 10, 2);
            $table->decimal('weight_kg', 10, 2);
            $table->decimal('total_cost_bs', 12, 2);
            $table->enum('status', ['RECIBIDA', 'PENDIENTE'])->default('RECIBIDA');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('cut_orders');
    }
};
`
  );

  root.file(
    'database/migrations/2026_01_01_000005_create_cash_shifts_and_bnb_qr_tables.php',
    `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cash_register_shifts', function (Blueprint $table) {
            $table->id();
            $table->integer('shift_number');
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('opened_by');
            $table->decimal('initial_cash', 12, 2);
            $table->decimal('cash_sales', 12, 2)->default(0);
            $table->decimal('qr_sales', 12, 2)->default(0);
            $table->decimal('credit_sales', 12, 2)->default(0);
            $table->decimal('expected_cash', 12, 2);
            $table->enum('status', ['ABIERTO', 'CERRADO'])->default('ABIERTO');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('counted_cash', 12, 2)->nullable();
            $table->decimal('difference', 12, 2)->nullable();
            $table->text('close_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('cash_register_shifts')->cascadeOnDelete();
            $table->enum('type', ['INGRESO', 'EGRESO']);
            $table->string('concept');
            $table->decimal('amount', 12, 2);
            $table->string('operator_name');
            $table->timestamps();
        });

        Schema::create('bnb_qr_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('qr_id')->unique();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->string('gloss');
            $table->decimal('amount', 12, 2);
            $table->enum('currency', ['BOB', 'USD'])->default('BOB');
            $table->date('expiration_date');
            $table->boolean('single_use')->default(true);
            $table->string('additional_data')->nullable();
            $table->string('destination_account_id', 10)->default('1');
            $table->longText('qr_image_base64');
            $table->tinyInteger('status_id')->default(1); // 1=No Usado, 2=Usado, 3=Expirado, 4=Error
            $table->string('voucher_id', 60)->nullable();
            $table->integer('source_bank_id')->nullable();
            $table->string('source_bank_name')->nullable();
            $table->string('origin_name')->nullable();
            $table->string('transaction_date_time')->nullable();
            $table->enum('mode', ['BNB_API', 'SIMULADOR'])->default('SIMULADOR');
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('module', ['SEGURIDAD', 'VENTAS', 'INVENTARIO', 'CAJA', 'PRODUCCION', 'BNB_QR']);
            $table->string('action');
            $table->text('detail');
            $table->string('actor_name');
            $table->string('actor_role');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('bnb_qr_transactions');
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_register_shifts');
    }
};
`
  );

  // 4. Models
  root.file(
    'app/Models/Branch.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Branch extends Model
{
    protected $fillable = ['code', 'name', 'city', 'address', 'is_factory'];
    protected $casts = ['is_factory' => 'boolean'];
}
`
  );

  root.file(
    'app/Models/User.php',
    `<?php

namespace App\\Models;

use Illuminate\\Foundation\\Auth\\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = ['username', 'full_name', 'role', 'branch_id', 'password', 'active'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['active' => 'boolean'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
`
  );

  root.file(
    'app/Models/Product.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Product extends Model
{
    protected $fillable = [
        'sku', 'name', 'profile_type', 'description', 'useful_width_m', 'total_width_m',
        'wave_or_step_info', 'base_price_per_meter', 'cuttable', 'unit_label',
        'min_length_m', 'max_length_m', 'default_length_m',
        'available_colors', 'available_gauges', 'active',
    ];

    protected $casts = [
        'cuttable' => 'boolean',
        'active' => 'boolean',
        'available_colors' => 'array',
        'available_gauges' => 'array',
    ];

    public function stocks()
    {
        return $this->hasMany(BranchProductStock::class);
    }
}
`
  );

  root.file(
    'app/Models/BranchProductStock.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class BranchProductStock extends Model
{
    protected $fillable = ['branch_id', 'product_id', 'stock_quantity'];
}
`
  );

  root.file(
    'app/Models/CoilStock.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class CoilStock extends Model
{
    protected $table = 'coils';
    protected $fillable = [
        'coil_code', 'branch_id', 'color_code', 'gauge', 'width_mm',
        'initial_meters', 'remaining_meters', 'weight_kg', 'supplier', 'lot_number', 'status',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
`
  );

  root.file(
    'app/Models/Client.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Client extends Model
{
    protected $fillable = ['name', 'nit_ci', 'phone', 'email', 'address', 'type', 'credit_limit', 'current_debt'];
}
`
  );

  root.file(
    'app/Models/Sale.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Sale extends Model
{
    protected $fillable = [
        'invoice_number', 'branch_id', 'user_id', 'client_id',
        'total_linear_meters', 'total_area_sqm', 'total_weight_kg',
        'subtotal', 'discount', 'freight_cost', 'total',
        'payment_method', 'cash_paid', 'qr_paid', 'credit_amount',
        'status', 'delivery_type', 'dispatch_status', 'delivery_address', 'notes',
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function qrTransaction()
    {
        return $this->hasOne(BnbQrTransaction::class);
    }
}
`
  );

  root.file(
    'app/Models/SaleItem.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'product_id', 'sku', 'product_name', 'profile_type', 'cuttable',
        'color_code', 'color_name', 'color_hex', 'gauge', 'length_meters',
        'quantity', 'total_linear_meters', 'area_sqm', 'weight_kg',
        'price_per_meter', 'unit_price', 'subtotal', 'cut_note',
    ];
}
`
  );

  root.file(
    'app/Models/Proforma.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Proforma extends Model
{
    protected $fillable = [
        'proforma_number', 'valid_until', 'branch_id', 'user_id', 'client_id',
        'items', 'subtotal', 'discount', 'freight_cost', 'total', 'status', 'notes',
    ];

    protected $casts = ['items' => 'array', 'valid_until' => 'date'];
}
`
  );

  root.file(
    'app/Models/CutOrder.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class CutOrder extends Model
{
    protected $fillable = [
        'order_number', 'sale_id', 'branch_id', 'client_name',
        'status', 'machine', 'priority', 'items', 'total_meters', 'operator_assigned',
    ];

    protected $casts = ['items' => 'array'];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
`
  );

  root.file(
    'app/Models/StockTransfer.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class StockTransfer extends Model
{
    protected $fillable = [
        'transfer_number', 'from_branch_id', 'to_branch_id', 'product_id',
        'color_code', 'gauge', 'quantity_meters_or_units', 'requested_by', 'status', 'notes',
    ];
}
`
  );

  root.file(
    'app/Models/CashRegisterShift.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class CashRegisterShift extends Model
{
    protected $fillable = [
        'shift_number', 'branch_id', 'opened_by', 'initial_cash', 'cash_sales',
        'qr_sales', 'credit_sales', 'expected_cash', 'status', 'closed_at',
        'counted_cash', 'difference', 'close_notes',
    ];

    public function movements()
    {
        return $this->hasMany(CashMovement::class, 'shift_id');
    }
}
`
  );

  root.file(
    'app/Models/CashMovement.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class CashMovement extends Model
{
    protected $fillable = ['shift_id', 'type', 'concept', 'amount', 'operator_name'];
}
`
  );

  root.file(
    'app/Models/BnbQrTransaction.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class BnbQrTransaction extends Model
{
    protected $fillable = [
        'qr_id', 'sale_id', 'gloss', 'amount', 'currency', 'expiration_date',
        'single_use', 'additional_data', 'destination_account_id', 'qr_image_base64',
        'status_id', 'voucher_id', 'source_bank_id', 'source_bank_name',
        'origin_name', 'transaction_date_time', 'mode',
    ];
}
`
  );

  root.file(
    'app/Models/AuditLog.php',
    `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class AuditLog extends Model
{
    protected $fillable = ['module', 'action', 'detail', 'actor_name', 'actor_role'];

    public static function record(string $module, string $action, string $detail, string $actorName, string $actorRole): void
    {
        static::create([
            'module' => $module,
            'action' => $action,
            'detail' => $detail,
            'actor_name' => $actorName,
            'actor_role' => $actorRole,
        ]);
    }
}
`
  );

  // 5. Services (CalaminaPricingService + BnbQrService)
  root.file(
    'app/Services/CalaminaPricingService.php',
    `<?php

namespace App\\Services;

use App\\Models\\Product;

class CalaminaPricingService
{
    public const COLORS = [
        ['code' => 'ZINC', 'name' => 'Zincalum Natural', 'hex' => '#B8C4CC', 'accent' => '#E2E8F0', 'finish' => 'GALVANIZADA', 'surcharge' => 0.0],
        ['code' => 'RAL-3009', 'name' => 'Rojo Teja', 'hex' => '#7E281F', 'accent' => '#A63A2E', 'finish' => 'PREPINTADA', 'surcharge' => 6.5],
        ['code' => 'RAL-5005', 'name' => 'Azul Zafiro', 'hex' => '#1A3D7C', 'accent' => '#2B57A8', 'finish' => 'PREPINTADA', 'surcharge' => 6.5],
        ['code' => 'RAL-6005', 'name' => 'Verde Bosque', 'hex' => '#184A32', 'accent' => '#266B4A', 'finish' => 'PREPINTADA', 'surcharge' => 6.5],
        ['code' => 'RAL-8004', 'name' => 'Terracota Colonial', 'hex' => '#9C4527', 'accent' => '#C25B37', 'finish' => 'PREPINTADA', 'surcharge' => 7.5],
        ['code' => 'RAL-9003', 'name' => 'Blanco Puro', 'hex' => '#EFF4F8', 'accent' => '#FFFFFF', 'finish' => 'PREPINTADA', 'surcharge' => 6.5],
        ['code' => 'RAL-9005', 'name' => 'Negro Mate', 'hex' => '#1F242B', 'accent' => '#3A424D', 'finish' => 'MATE', 'surcharge' => 8.0],
        ['code' => 'RAL-7016', 'name' => 'Gris Antracita', 'hex' => '#38414A', 'accent' => '#525E6B', 'finish' => 'MATE', 'surcharge' => 7.5],
        ['code' => 'RAL-3005', 'name' => 'Rojo Vino', 'hex' => '#5E1D24', 'accent' => '#802A34', 'finish' => 'PREPINTADA', 'surcharge' => 7.0],
        ['code' => 'RAL-2004', 'name' => 'Naranja Industrial', 'hex' => '#D9531E', 'accent' => '#F97316', 'finish' => 'PREPINTADA', 'surcharge' => 7.0],
        ['code' => 'RAL-8017', 'name' => 'Café Colonial', 'hex' => '#4A3228', 'accent' => '#694739', 'finish' => 'MATE', 'surcharge' => 7.5],
        ['code' => 'TRANS', 'name' => 'Cristal Traslúcido', 'hex' => '#D8F3FF', 'accent' => '#FFFFFF', 'finish' => 'TRASLUCIDA', 'surcharge' => 14.0],
        ['code' => 'OPAL', 'name' => 'Blanco Opal Traslúcido', 'hex' => '#F1F8FC', 'accent' => '#E0F2FE', 'finish' => 'TRASLUCIDA', 'surcharge' => 14.0],
    ];

    public const GAUGES = [
        '24' => ['thickness' => 0.55, 'multiplier' => 1.32, 'weight' => 4.85, 'label' => 'Cal. 24 (0.55 mm · Industrial)'],
        '26' => ['thickness' => 0.45, 'multiplier' => 1.15, 'weight' => 3.95, 'label' => 'Cal. 26 (0.45 mm · Reforzada)'],
        '28' => ['thickness' => 0.35, 'multiplier' => 1.00, 'weight' => 3.15, 'label' => 'Cal. 28 (0.35 mm · Estándar)'],
        '30' => ['thickness' => 0.30, 'multiplier' => 0.87, 'weight' => 2.65, 'label' => 'Cal. 30 (0.30 mm · Residencial)'],
        '32' => ['thickness' => 0.25, 'multiplier' => 0.76, 'weight' => 2.20, 'label' => 'Cal. 32 (0.25 mm · Económica)'],
    ];

    public static function getColor(string $code): array
    {
        foreach (self::COLORS as $c) {
            if ($c['code'] === $code) {
                return $c;
            }
        }
        return self::COLORS[0];
    }

    public static function computePricing(Product $product, string $colorCode, string $gauge, float $lengthMeters): array
    {
        if (!$product->cuttable) {
            return [
                'price_per_meter' => (float) $product->base_price_per_meter,
                'unit_price' => round((float) $product->base_price_per_meter, 2),
                'area_sqm' => 0.0,
                'weight_kg' => 0.4,
            ];
        }

        $color = self::getColor($colorCode);
        $gSpec = self::GAUGES[$gauge] ?? self::GAUGES['28'];

        $pricePerMeter = round(($product->base_price_per_meter * $gSpec['multiplier']) + $color['surcharge'], 2);
        $unitPrice = round($pricePerMeter * $lengthMeters, 2);
        $areaSqm = round($product->useful_width_m * $lengthMeters, 2);
        $weightKg = round($product->total_width_m * $lengthMeters * $gSpec['weight'], 2);

        return [
            'price_per_meter' => $pricePerMeter,
            'unit_price' => $unitPrice,
            'area_sqm' => $areaSqm,
            'weight_kg' => $weightKg,
        ];
    }
}
`
  );

  root.file(
    'app/Services/BnbQrService.php',
    `<?php

namespace App\\Services;

use App\\Models\\BnbQrTransaction;
use App\\Models\\Sale;
use Illuminate\\Support\\Facades\\Cache;
use Illuminate\\Support\\Facades\\Http;

class BnbQrService
{
    public const BANKS = [
        1 => 'Banco Nacional de Bolivia (BNB)',
        2 => 'Banco Mercantil Santa Cruz',
        3 => 'Banco Bisa',
        4 => 'Banco de Crédito (BCP)',
        5 => 'Banco Unión',
        6 => 'Banco Ganadero',
        7 => 'Banco Económico',
        8 => 'Banco Sol',
    ];

    /**
     * Servicio 5: POST /ClientAuthentication.API/api/v1/auth/token
     */
    public function getBearerToken(): ?string
    {
        $accountId = config('bnb.account_id');
        $authId = config('bnb.authorization_id');
        if (!$accountId || !$authId) {
            return null;
        }

        return Cache::remember('bnb_api_token', now()->addMinutes(50), function () use ($accountId, $authId) {
            $resp = Http::post(config('bnb.base_url') . '/ClientAuthentication.API/api/v1/auth/token', [
                'accountId' => $accountId,
                'authorizationId' => $authId,
            ]);
            if ($resp->successful() && $resp->json('success')) {
                return $resp->json('message');
            }
            return null;
        });
    }

    /**
     * Servicio 7: POST /QRSimple.API/api/v1/main/getQRWithImageAsync
     */
    public function generateQr(float $amount, string $gloss, string $currency = 'BOB', string $additionalData = 'ACEROCAL Calaminas'): BnbQrTransaction
    {
        $expirationDate = now()->addDay()->toDateString();
        $mode = config('bnb.mode', 'SIMULADOR');
        $destAccount = config('bnb.destination_account_id', '1');

        if ($mode === 'BNB_API' && ($token = $this->getBearerToken())) {
            $resp = Http::withToken($token)->post(config('bnb.base_url') . '/QRSimple.API/api/v1/main/getQRWithImageAsync', [
                'currency' => $currency,
                'gloss' => $gloss,
                'amount' => round($amount, 2),
                'singleUse' => true,
                'expirationDate' => $expirationDate,
                'additionalData' => $additionalData,
                'destinationAccountId' => $destAccount,
            ]);

            if ($resp->successful() && $resp->json('success')) {
                return BnbQrTransaction::create([
                    'qr_id' => (int) $resp->json('id'),
                    'gloss' => $gloss,
                    'amount' => round($amount, 2),
                    'currency' => $currency,
                    'expiration_date' => $expirationDate,
                    'single_use' => true,
                    'additional_data' => $additionalData,
                    'destination_account_id' => $destAccount,
                    'qr_image_base64' => $resp->json('qr'),
                    'status_id' => 1,
                    'mode' => 'BNB_API',
                ]);
            }
        }

        // Simulador local BNB QR Simple (EMVCo SVG/PNG base64)
        $qrId = (int) (BnbQrTransaction::max('qr_id') ?? 940100) + 1;
        $emv = "00020101021226360010BO.BNB.QRS0108" . str_pad((string)$qrId, 8, '0', STR_PAD_LEFT)
             . "5204521153030685405" . number_format($amount, 2, '.', '') . "5802BO5918ACEROCAL CALAMINAS6010SANTA CRUZ";

        $svgQr = base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#fff"/><rect x="14" y="14" width="42" height="42" fill="#0b1324"/><rect x="22" y="22" width="26" height="26" fill="#fff"/><rect x="28" y="28" width="14" height="14" fill="#0b1324"/><rect x="124" y="14" width="42" height="42" fill="#0b1324"/><rect x="132" y="22" width="26" height="26" fill="#fff"/><rect x="138" y="28" width="14" height="14" fill="#0b1324"/><rect x="14" y="124" width="42" height="42" fill="#0b1324"/><rect x="22" y="132" width="26" height="26" fill="#fff"/><rect x="28" y="138" width="14" height="14" fill="#0b1324"/><text x="90" y="96" font-size="11" font-family="monospace" text-anchor="middle" fill="#009b3a">BNB #' . $qrId . '</text><text x="90" y="112" font-size="9" font-family="monospace" text-anchor="middle" fill="#0b1324">Bs ' . number_format($amount, 2) . '</text></svg>');

        return BnbQrTransaction::create([
            'qr_id' => $qrId,
            'gloss' => $gloss,
            'amount' => round($amount, 2),
            'currency' => $currency,
            'expiration_date' => $expirationDate,
            'single_use' => true,
            'additional_data' => $emv,
            'destination_account_id' => $destAccount,
            'qr_image_base64' => $svgQr,
            'status_id' => 1,
            'mode' => 'SIMULADOR',
        ]);
    }

    /**
     * Servicio 9: POST /QRSimple.API/api/v1/main/getQRStatusAsync
     */
    public function checkStatus(int $qrId): ?BnbQrTransaction
    {
        $tx = BnbQrTransaction::where('qr_id', $qrId)->first();
        if (!$tx) return null;

        if ($tx->mode === 'BNB_API' && ($token = $this->getBearerToken())) {
            $resp = Http::withToken($token)->post(config('bnb.base_url') . '/QRSimple.API/api/v1/main/getQRStatusAsync', [
                'qrId' => $qrId,
            ]);
            if ($resp->successful() && $resp->json('success')) {
                $tx->update([
                    'status_id' => $resp->json('statusId', $tx->status_id),
                    'voucher_id' => $resp->json('voucherId', $tx->voucher_id),
                ]);
            }
        }
        return $tx->fresh();
    }

    /**
     * Webhook: ReceiveNotification (Notificación V2)
     */
    public function handleNotification(array $payload): array
    {
        $qrId = (int) ($payload['QRId'] ?? 0);
        $tx = BnbQrTransaction::where('qr_id', $qrId)->first();
        if (!$tx) {
            return ['success' => false, 'message' => 'QRId no encontrado'];
        }
        if ($tx->status_id === 3) {
            return ['success' => false, 'message' => 'QR expirado o anulado'];
        }

        $bankId = (int) ($payload['sourceBankId'] ?? 1);
        $tx->update([
            'status_id' => 2,
            'voucher_id' => $payload['VoucherId'] ?? strtoupper(substr(md5((string)microtime(true)), 0, 10)),
            'source_bank_id' => $bankId,
            'source_bank_name' => self::BANKS[$bankId] ?? 'Banco #' . $bankId,
            'origin_name' => $payload['originName'] ?? 'PAGADOR QR SIMPLE',
            'transaction_date_time' => $payload['TransactionDateTime'] ?? now()->format('d/m/Y H:i:s'),
        ]);

        if ($tx->sale_id) {
            Sale::where('id', $tx->sale_id)->where('status', 'PENDIENTE_QR')->update(['status' => 'COMPLETADA']);
        }

        return ['success' => true, 'message' => 'OK', 'transaction' => $tx->fresh()];
    }
}
`
  );

  // 6. Controllers
  root.file(
    'app/Http/Controllers/AuthController.php',
    `<?php

namespace App\\Http\\Controllers;

use App\\Models\\AuditLog;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt(['username' => strtolower($credentials['username']), 'password' => $credentials['password'], 'active' => true], $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();
            AuditLog::record('SEGURIDAD', 'Inicio de Sesión', 'Ingreso al sistema @' . $user->username, $user->full_name, $user->role);
            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors(['username' => 'Credenciales inválidas o usuario inactivo.'])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }
}
`
  );

  root.file(
    'app/Http/Controllers/DashboardController.php',
    `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Branch;
use App\\Models\\CoilStock;
use App\\Models\\CutOrder;
use App\\Models\\Product;
use App\\Models\\Sale;
use Illuminate\\Http\\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'day');
        $branchId = session('active_branch_id', Branch::first()?->id ?? 1);

        $salesQuery = Sale::where('status', '!=', 'ANULADA');
        if ($period === 'day') {
            $salesQuery->whereDate('created_at', today());
        } elseif ($period === 'week') {
            $salesQuery->where('created_at', '>=', now()->subDays(7));
        } elseif ($period === 'month') {
            $salesQuery->where('created_at', '>=', now()->subDays(30));
        }

        $salesCount = $salesQuery->count();
        $revenue = (float) $salesQuery->sum('total');
        $avgTicket = $salesCount > 0 ? $revenue / $salesCount : 0;

        $products = Product::with('stocks')->where('active', true)->get();
        $coils = CoilStock::where('status', '!=', 'AGOTADA')->limit(6)->get();
        $cutOrders = CutOrder::where('status', '!=', 'ENTREGADO')->latest()->limit(5)->get();
        $branches = Branch::all();

        return view('dashboard', compact(
            'period', 'branchId', 'branches', 'salesCount', 'revenue', 'avgTicket',
            'products', 'coils', 'cutOrders'
        ));
    }

    public function switchBranch(Request $request)
    {
        $request->validate(['branch_id' => 'required|exists:branches,id']);
        session(['active_branch_id' => (int) $request->branch_id]);
        return back();
    }
}
`
  );

  root.file(
    'app/Http/Controllers/PosController.php',
    `<?php

namespace App\\Http\\Controllers;

use App\\Models\\AuditLog;
use App\\Models\\Branch;
use App\\Models\\BranchProductStock;
use App\\Models\\CashRegisterShift;
use App\\Models\\Client;
use App\\Models\\CoilStock;
use App\\Models\\CutOrder;
use App\\Models\\Product;
use App\\Models\\Sale;
use App\\Models\\SaleItem;
use App\\Services\\CalaminaPricingService;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;
use Illuminate\\Support\\Facades\\DB;

class PosController extends Controller
{
    public function index()
    {
        $branchId = session('active_branch_id', Branch::first()?->id ?? 1);
        $products = Product::with('stocks')->where('active', true)->get();
        $clients = Client::all();
        $activeShift = CashRegisterShift::where('status', 'ABIERTO')->where('branch_id', $branchId)->first();
        $colors = CalaminaPricingService::COLORS;
        $gauges = CalaminaPricingService::GAUGES;

        return view('pos.index', compact('branchId', 'products', 'clients', 'activeShift', 'colors', 'gauges'));
    }

    public function storeSale(Request $request)
    {
        $data = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'client_id' => 'required|exists:clients,id',
            'payment_method' => 'required|in:EFECTIVO,QR_BNB,MIXTO,CREDITO',
            'delivery_type' => 'nullable|in:RETIRO_PLANTA,ENVIO_OBRA',
            'delivery_address' => 'nullable|string|max:255',
            'discount' => 'nullable|numeric|min:0',
            'freight_cost' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:NORMAL,URGENTE',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.color_code' => 'required|string',
            'items.*.gauge' => 'required|string',
            'items.*.length_meters' => 'required|numeric|min:0.5',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $branch = Branch::findOrFail($data['branch_id']);
            $client = Client::findOrFail($data['client_id']);

            $subtotal = 0;
            $totalMeters = 0;
            $totalArea = 0;
            $totalWeight = 0;
            $computedItems = [];

            foreach ($data['items'] as $raw) {
                $prod = Product::findOrFail($raw['product_id']);
                $color = CalaminaPricingService::getColor($raw['color_code']);
                $pricing = CalaminaPricingService::computePricing($prod, $color['code'], $raw['gauge'], (float) $raw['length_meters']);
                $qty = (int) $raw['quantity'];
                $itemSub = round($pricing['unit_price'] * $qty, 2);
                $itemMeters = $prod->cuttable ? round($raw['length_meters'] * $qty, 2) : 0;

                $subtotal += $itemSub;
                $totalMeters += $itemMeters;
                $totalArea += round($pricing['area_sqm'] * $qty, 2);
                $totalWeight += round($pricing['weight_kg'] * $qty, 2);

                $computedItems[] = [
                    'product' => $prod,
                    'color' => $color,
                    'gauge' => $raw['gauge'],
                    'length_meters' => (float) $raw['length_meters'],
                    'quantity' => $qty,
                    'total_linear_meters' => $prod->cuttable ? $itemMeters : $qty,
                    'area_sqm' => round($pricing['area_sqm'] * $qty, 2),
                    'weight_kg' => round($pricing['weight_kg'] * $qty, 2),
                    'price_per_meter' => $pricing['price_per_meter'],
                    'unit_price' => $pricing['unit_price'],
                    'subtotal' => $itemSub,
                ];
            }

            $discount = (float) ($data['discount'] ?? 0);
            $freight = (float) ($data['freight_cost'] ?? 0);
            $total = max(0, round($subtotal - $discount + $freight, 2));
            $seq = (Sale::max('id') ?? 0) + 1;

            $sale = Sale::create([
                'invoice_number' => 'FAC-' . str_pad((string)$seq, 6, '0', STR_PAD_LEFT),
                'branch_id' => $branch->id,
                'user_id' => $user->id,
                'client_id' => $client->id,
                'total_linear_meters' => $totalMeters,
                'total_area_sqm' => $totalArea,
                'total_weight_kg' => $totalWeight,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'freight_cost' => $freight,
                'total' => $total,
                'payment_method' => $data['payment_method'],
                'cash_paid' => $data['payment_method'] === 'EFECTIVO' ? $total : 0,
                'qr_paid' => $data['payment_method'] === 'QR_BNB' ? $total : 0,
                'credit_amount' => $data['payment_method'] === 'CREDITO' ? $total : 0,
                'status' => 'COMPLETADA',
                'delivery_type' => $data['delivery_type'] ?? 'RETIRO_PLANTA',
                'dispatch_status' => 'EN_PLANTA',
                'delivery_address' => $data['delivery_address'] ?? null,
            ]);

            $cutItems = [];
            foreach ($computedItems as $ci) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $ci['product']->id,
                    'sku' => $ci['product']->sku,
                    'product_name' => $ci['product']->name,
                    'profile_type' => $ci['product']->profile_type,
                    'cuttable' => $ci['product']->cuttable,
                    'color_code' => $ci['color']['code'],
                    'color_name' => $ci['color']['name'],
                    'color_hex' => $ci['color']['hex'],
                    'gauge' => $ci['gauge'],
                    'length_meters' => $ci['length_meters'],
                    'quantity' => $ci['quantity'],
                    'total_linear_meters' => $ci['total_linear_meters'],
                    'area_sqm' => $ci['area_sqm'],
                    'weight_kg' => $ci['weight_kg'],
                    'price_per_meter' => $ci['price_per_meter'],
                    'unit_price' => $ci['unit_price'],
                    'subtotal' => $ci['subtotal'],
                ]);

                $stock = BranchProductStock::firstOrCreate(
                    ['branch_id' => $branch->id, 'product_id' => $ci['product']->id],
                    ['stock_quantity' => 0]
                );
                $deduct = $ci['product']->cuttable ? $ci['total_linear_meters'] : $ci['quantity'];
                $stock->update(['stock_quantity' => max(0, $stock->stock_quantity - $deduct)]);

                if ($ci['product']->cuttable) {
                    $coil = CoilStock::where('branch_id', $branch->id)
                        ->where('color_code', $ci['color']['code'])
                        ->where('remaining_meters', '>', 0)
                        ->first();
                    if ($coil) {
                        $coil->update(['remaining_meters' => max(0, $coil->remaining_meters - $ci['total_linear_meters'])]);
                    }
                    $cutItems[] = [
                        'product_name' => $ci['product']->name,
                        'color_name' => $ci['color']['name'],
                        'gauge' => $ci['gauge'],
                        'length_meters' => $ci['length_meters'],
                        'quantity' => $ci['quantity'],
                        'total_linear_meters' => $ci['total_linear_meters'],
                    ];
                }
            }

            if (count($cutItems) > 0) {
                CutOrder::create([
                    'order_number' => 'COR-' . str_pad((string)$seq, 5, '0', STR_PAD_LEFT),
                    'sale_id' => $sale->id,
                    'branch_id' => $branch->id,
                    'client_name' => $client->name,
                    'status' => 'PENDIENTE',
                    'machine' => 'Roladora Principal ACEROCAL',
                    'priority' => $data['priority'] ?? 'NORMAL',
                    'items' => $cutItems,
                    'total_meters' => $totalMeters,
                ]);
            }

            AuditLog::record('VENTAS', 'Venta Registrada', "{$sale->invoice_number} · Bs {$total} ({$sale->payment_method})", $user->full_name, $user->role);

            return response()->json(['sale' => $sale->load('items')], 201);
        });
    }
}
`
  );

  root.file(
    'app/Http/Controllers/BnbQrController.php',
    `<?php

namespace App\\Http\\Controllers;

use App\\Models\\AuditLog;
use App\\Services\\BnbQrService;
use Illuminate\\Http\\Request;

class BnbQrController extends Controller
{
    public function __construct(private BnbQrService $bnb) {}

    public function generate(Request $request)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.5',
            'gloss' => 'required|string|max:100',
            'currency' => 'nullable|in:BOB,USD',
        ]);

        $tx = $this->bnb->generateQr((float) $data['amount'], $data['gloss'], $data['currency'] ?? 'BOB');
        return response()->json(['success' => true, 'transaction' => $tx]);
    }

    public function status(int $qrId)
    {
        $tx = $this->bnb->checkStatus($qrId);
        return response()->json(['success' => (bool)$tx, 'transaction' => $tx]);
    }

    public function simulatePay(int $qrId)
    {
        $res = $this->bnb->handleNotification([
            'QRId' => $qrId,
            'sourceBankId' => 1,
            'originName' => 'CLIENTE SIMULADOR BNB',
        ]);
        return response()->json($res);
    }

    /**
     * Webhook Oficial BNB Open Banking V2: POST /api/bnb/ReceiveNotification
     */
    public function receiveNotification(Request $request)
    {
        $secret = config('bnb.webhook_secret');
        if ($secret && !hash_equals($secret, (string) $request->header('X-BNB-Secret', ''))) {
            return response()->json(['success' => false, 'message' => 'Firma inválida'], 401);
        }

        $res = $this->bnb->handleNotification($request->all());
        if ($res['success']) {
            AuditLog::record('BNB_QR', 'Webhook ReceiveNotification', 'QR #' . $request->input('QRId') . ' confirmado', 'Webhook BNB', 'API_MARKET');
        }
        return response()->json($res, $res['success'] ? 200 : 400);
    }
}
`
  );

  root.file(
    'app/Http/Controllers/OperationsController.php',
    `<?php

namespace App\\Http\\Controllers;

use App\\Models\\AuditLog;
use App\\Models\\Branch;
use App\\Models\\CoilStock;
use App\\Models\\CutOrder;
use App\\Models\\Product;
use App\\Models\\Sale;
use Illuminate\\Http\\Request;

class OperationsController extends Controller
{
    public function inventory()
    {
        $products = Product::with('stocks')->get();
        $coils = CoilStock::with('branch')->get();
        $branches = Branch::all();
        return view('inventory.index', compact('products', 'coils', 'branches'));
    }

    public function cutOrders()
    {
        $cutOrders = CutOrder::latest()->get();
        return view('cut-orders.index', compact('cutOrders'));
    }

    public function updateCutOrderStatus(Request $request, CutOrder $cutOrder)
    {
        $request->validate(['status' => 'required|in:PENDIENTE,EN_ROLADORA,LISTO,ENTREGADO']);
        $cutOrder->update(['status' => $request->status]);
        return back();
    }

    public function sales()
    {
        $sales = Sale::with(['client', 'branch', 'items'])->latest()->get();
        return view('sales.index', compact('sales'));
    }

    public function updateDispatch(Request $request, Sale $sale)
    {
        $request->validate(['dispatch_status' => 'required|in:EN_PLANTA,CARGANDO_CAMION,EN_RUTA,ENTREGADO']);
        $sale->update(['dispatch_status' => $request->dispatch_status]);
        return back();
    }

    public function audit()
    {
        $logs = AuditLog::latest()->limit(200)->get();
        return view('audit.index', compact('logs'));
    }
}
`
  );

  // 7. Routes
  root.file(
    'routes/web.php',
    `<?php

use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\DashboardController;
use App\\Http\\Controllers\\OperationsController;
use App\\Http\\Controllers\\PosController;
use Illuminate\\Support\\Facades\\Route;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/branch/switch', [DashboardController::class, 'switchBranch'])->name('branch.switch');

    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/sales', [PosController::class, 'storeSale'])->name('pos.sales.store');

    Route::get('/inventory', [OperationsController::class, 'inventory'])->name('inventory.index');
    Route::get('/cut-orders', [OperationsController::class, 'cutOrders'])->name('cut-orders.index');
    Route::patch('/cut-orders/{cutOrder}', [OperationsController::class, 'updateCutOrderStatus'])->name('cut-orders.update');
    Route::get('/sales', [OperationsController::class, 'sales'])->name('sales.index');
    Route::patch('/sales/{sale}/dispatch', [OperationsController::class, 'updateDispatch'])->name('sales.dispatch');
    Route::get('/audit', [OperationsController::class, 'audit'])->name('audit.index');
});
`
  );

  root.file(
    'routes/api.php',
    `<?php

use App\\Http\\Controllers\\BnbQrController;
use Illuminate\\Support\\Facades\\Route;

// Webhook público para BNB Open Banking QR Notification V2
Route::post('/bnb/ReceiveNotification', [BnbQrController::class, 'receiveNotification']);

Route::middleware('web')->group(function () {
    Route::post('/bnb/qr/generate', [BnbQrController::class, 'generate']);
    Route::get('/bnb/qr/{qrId}/status', [BnbQrController::class, 'status']);
    Route::post('/bnb/qr/{qrId}/simulate-pay', [BnbQrController::class, 'simulatePay']);
});
`
  );

  // 8. Seeder
  root.file(
    'database/seeders/AcerocalSeeder.php',
    `<?php

namespace Database\\Seeders;

use App\\Models\\Branch;
use App\\Models\\BranchProductStock;
use App\\Models\\Client;
use App\\Models\\CoilStock;
use App\\Models\\Product;
use App\\Models\\User;
use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\Hash;

class AcerocalSeeder extends Seeder
{
    public function run(): void
    {
        $scz = Branch::create(['code' => 'SUC-01', 'name' => 'Planta Central Warnes / SCZ', 'city' => 'Santa Cruz', 'address' => 'Parque Industrial Latinoamericano Mz 14', 'is_factory' => true]);
        $cbb = Branch::create(['code' => 'SUC-02', 'name' => 'Sucursal Cochabamba', 'city' => 'Cochabamba', 'address' => 'Av. Blanco Galindo Km 6.5', 'is_factory' => false]);
        $lpb = Branch::create(['code' => 'SUC-03', 'name' => 'Agencia El Alto', 'city' => 'La Paz', 'address' => 'Av. 6 de Marzo N° 410', 'is_factory' => false]);

        User::create([
            'username' => 'admin',
            'full_name' => 'Administrador Sistema',
            'role' => 'ADMIN',
            'branch_id' => $scz->id,
            'password' => Hash::make('acerocal2026'),
            'active' => true,
        ]);

        Client::create(['name' => 'VENTA MOSTRADOR (CONSUMIDOR FINAL)', 'nit_ci' => '0', 'type' => 'PARTICULAR']);
        Client::create(['name' => 'Constructora Los Tajibos S.R.L.', 'nit_ci' => '1028475021', 'phone' => '77012345', 'address' => 'Equipetrol Norte, SCZ', 'type' => 'CONSTRUCTORA', 'credit_limit' => 80000]);
        Client::create(['name' => 'Ferretería El Techo Dorado', 'nit_ci' => '4591820014', 'phone' => '71598765', 'address' => 'Av. Grigotá 3er Anillo, SCZ', 'type' => 'FERRETERIA', 'credit_limit' => 35000]);

        $catalog = [
            ['OND-ZINC-11', 'Calamina Ondulada Zincalum 11 Ondas', 'ONDULADA', 0.80, 0.90, 38.50, true, 'ml', ['ZINC']],
            ['OND-COLOR-11', 'Calamina Ondulada Prepintada Color RAL', 'ONDULADA', 0.80, 0.90, 41.00, true, 'ml', ['RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-9003', 'RAL-2004', 'RAL-7016']],
            ['TRAP-T101-IND', 'Calamina Trapezoidal T101 Industrial', 'TRAPEZOIDAL', 1.00, 1.08, 49.00, true, 'ml', ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-9003', 'RAL-7016', 'RAL-2004']],
            ['TEJA-ESP-35', 'Calamina Teja Española Colonial Paso 35cm', 'TEJA_ESPANOLA', 0.96, 1.05, 58.00, true, 'ml', ['RAL-8004', 'RAL-3009', 'RAL-3005', 'RAL-8017', 'RAL-9005']],
            ['TRASL-OND-PC', 'Calamina Traslúcida Policarbonato Ondulada', 'TRASLUCIDA', 0.80, 0.90, 56.00, true, 'ml', ['TRANS', 'OPAL']],
            ['PANEL-PUR-40MM', 'Panel Termoacústico Sándwich PUR 40mm', 'PANEL_TERMICO', 1.00, 1.06, 142.00, true, 'ml', ['RAL-9003', 'RAL-3009', 'RAL-5005', 'RAL-7016']],
            ['CUMB-ESP-200', 'Cumbrera Plegada Estándar / Teja', 'CUMBRERA', 0.40, 0.45, 28.00, true, 'ml', ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-8004', 'RAL-9005', 'RAL-8017']],
            ['PERF-COST-100', 'Perfil Costanera C 100x50x15mm (Tira 6m)', 'PERFIL', 0.10, 0.15, 138.00, false, 'tira 6m', ['ZINC']],
            ['TORN-AUT-2.5', 'Tornillo Autoperforante 2.5" EPDM (Bolsa x100)', 'ACCESORIO', 0.00, 0.00, 48.00, false, 'bolsa', ['ZINC', 'RAL-3009', 'RAL-8004']],
        ];

        foreach ($catalog as $row) {
            $p = Product::create([
                'sku' => $row[0], 'name' => $row[1], 'profile_type' => $row[2],
                'useful_width_m' => $row[3], 'total_width_m' => $row[4],
                'base_price_per_meter' => $row[5], 'cuttable' => $row[6], 'unit_label' => $row[7],
                'available_colors' => $row[8], 'available_gauges' => ['24', '26', '28', '30'],
            ]);
            BranchProductStock::create(['branch_id' => $scz->id, 'product_id' => $p->id, 'stock_quantity' => 2400]);
            BranchProductStock::create(['branch_id' => $cbb->id, 'product_id' => $p->id, 'stock_quantity' => 850]);
            BranchProductStock::create(['branch_id' => $lpb->id, 'product_id' => $p->id, 'stock_quantity' => 620]);
        }

        CoilStock::create(['coil_code' => 'BOB-SCZ-01', 'branch_id' => $scz->id, 'color_code' => 'ZINC', 'gauge' => '28', 'initial_meters' => 1500, 'remaining_meters' => 1280, 'weight_kg' => 4200, 'supplier' => 'Ternium Acero', 'lot_number' => 'LOT-2026-A1']);
        CoilStock::create(['coil_code' => 'BOB-SCZ-02', 'branch_id' => $scz->id, 'color_code' => 'RAL-3009', 'gauge' => '28', 'initial_meters' => 1200, 'remaining_meters' => 980, 'weight_kg' => 3600, 'supplier' => 'Posco Steel', 'lot_number' => 'LOT-2026-B4']);
        CoilStock::create(['coil_code' => 'BOB-SCZ-03', 'branch_id' => $scz->id, 'color_code' => 'RAL-5005', 'gauge' => '26', 'initial_meters' => 1000, 'remaining_meters' => 860, 'weight_kg' => 3850, 'supplier' => 'Posco Steel', 'lot_number' => 'LOT-2026-C2']);
    }
}
`
  );

  // 9. Frontend Assets & Blade Views
  root.file(
    'resources/css/app.css',
    `@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

.industrial-top-strip {
  height: 4px;
  background-image: repeating-linear-gradient(
    90deg,
    #0b1324 0px,
    #0b1324 14px,
    #c2410c 14px,
    #c2410c 28px,
    #f59e0b 28px,
    #f59e0b 36px
  );
}
`
  );

  root.file('resources/js/app.js', `import './bootstrap';\n`);
  root.file('resources/js/bootstrap.js', `import axios from 'axios';\nwindow.axios = axios;\n`);

  root.file(
    'resources/views/layouts/app.blade.php',
    `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ACEROCAL · Sistema de Ventas para Fábrica de Calaminas</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:ital,wght@0,600..900;1,700..900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-[#f4f6f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
    <div class="industrial-top-strip w-full sticky top-0 z-50"></div>
    <div class="flex-1 flex min-h-0">
        @auth
        <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 shrink-0">
            <div>
                <div class="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-[#c2410c] text-white flex items-center justify-center font-black">AC</div>
                    <div>
                        <div class="font-black italic text-lg leading-none">ACEROCAL</div>
                        <div class="text-[10px] font-bold tracking-widest uppercase text-[#c2410c]">PRO CALAMINAS</div>
                    </div>
                </div>
                <nav class="space-y-1 text-xs font-bold uppercase tracking-wide">
                    <a href="{{ route('dashboard') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('dashboard') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Tablero Principal</a>
                    <a href="{{ route('pos.index') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('pos.*') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Cotizar / POS Mostrador</a>
                    <a href="{{ route('cut-orders.index') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('cut-orders.*') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Órdenes de Corte</a>
                    <a href="{{ route('inventory.index') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('inventory.*') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Almacén y Bobinas</a>
                    <a href="{{ route('sales.index') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('sales.*') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Historial Ventas</a>
                    <a href="{{ route('audit.index') }}" class="block px-3.5 py-2.5 rounded-xl {{ request()->routeIs('audit.*') ? 'bg-orange-50 text-[#c2410c]' : 'text-slate-600 hover:bg-slate-100' }}">Seguridad / Auditoría</a>
                </nav>
            </div>
            <form method="POST" action="{{ route('logout') }}" class="pt-4 border-t border-slate-100">
                @csrf
                <div class="text-xs font-bold truncate">{{ auth()->user()->full_name }}</div>
                <div class="text-[10px] text-slate-400 uppercase mb-2">{{ auth()->user()->role }}</div>
                <button type="submit" class="w-full py-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-xs font-bold uppercase">Cerrar Sesión</button>
            </form>
        </aside>
        @endauth
        <div class="flex-1 flex flex-col min-w-0">
            <main class="p-6 max-w-7xl w-full mx-auto">
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
`
  );

  root.file(
    'resources/views/auth/login.blade.php',
    `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ACEROCAL · Acceso al Sistema</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200">
        <div class="industrial-top-strip w-full"></div>
        <div class="grid grid-cols-1 lg:grid-cols-12">
            <div class="lg:col-span-6 p-10 text-white bg-gradient-to-br from-[#070d1c] via-[#0b1324] to-[#9a3412] flex flex-col justify-between">
                <div>
                    <p class="text-[11px] font-bold tracking-widest uppercase text-orange-400 mb-2">FÁBRICA & LAMINADORA DE TECHOS METÁLICOS</p>
                    <h1 class="text-5xl font-black italic tracking-tight mb-4">ACERO<span class="text-[#ff5a1f]">CAL</span></h1>
                    <p class="text-sm text-slate-300 mb-6">Sistema Laravel 11 para venta de calaminas a medida, control de bobinas RAL, corte en roladora, stock multi-sucursal y Pago QR BNB.</p>
                </div>
                <div class="text-xs font-bold uppercase tracking-wider text-slate-300 border-t border-white/10 pt-4">
                    13 COLORES RAL · CORTE EXACTO · QR BNB OPEN BANKING
                </div>
            </div>
            <div class="lg:col-span-6 p-10 flex flex-col justify-center">
                <h2 class="text-2xl font-black italic uppercase mb-2">ACCESO AL SISTEMA</h2>
                <p class="text-sm text-slate-500 mb-6">Ingresa tus credenciales para operar el mostrador y planta.</p>
                @if($errors->any())
                    <div class="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">{{ $errors->first() }}</div>
                @endif
                <form method="POST" action="{{ route('login.post') }}" class="space-y-4">
                    @csrf
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Usuario</label>
                        <input type="text" name="username" value="{{ old('username', 'admin') }}" required class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Clave de Acceso</label>
                        <input type="password" name="password" required class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50">
                    </div>
                    <button type="submit" class="w-full py-3.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-bold text-xs uppercase tracking-wider">Ingresar al Sistema</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
`
  );

  root.file(
    'resources/views/dashboard.blade.php',
    `@extends('layouts.app')
@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[#c2410c]">FÁBRICA DE CALAMINAS Y CUBIERTAS</p>
            <h1 class="text-3xl font-black italic uppercase">OPERACIONES ACEROCAL</h1>
        </div>
        <a href="{{ route('pos.index') }}" class="px-5 py-3 rounded-xl bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider">Vender / Cotizar</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white border border-slate-200">
            <div class="text-xs font-bold uppercase text-slate-400">Cantidad de Ventas</div>
            <div class="text-3xl font-black mt-2">{{ $salesCount }}</div>
        </div>
        <div class="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div class="text-xs font-bold uppercase text-emerald-700">Ingresos del Período</div>
            <div class="text-3xl font-black text-emerald-600 mt-2">Bs {{ number_format($revenue, 2) }}</div>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-slate-200">
            <div class="text-xs font-bold uppercase text-slate-400">Ticket Promedio</div>
            <div class="text-3xl font-black text-[#c2410c] mt-2">Bs {{ number_format($avgTicket, 2) }}</div>
        </div>
    </div>
    <div class="p-6 rounded-2xl bg-white border border-slate-200">
        <h2 class="font-black italic uppercase mb-4">Catálogo Activo ({{ $products->count() }})</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @foreach($products as $p)
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div class="text-[10px] font-bold text-[#c2410c]">{{ $p->sku }} · {{ $p->profile_type }}</div>
                <div class="font-bold text-sm mt-1">{{ $p->name }}</div>
                <div class="text-sm font-black mt-2">Bs {{ number_format($p->base_price_per_meter, 2) }} / {{ $p->unit_label }}</div>
            </div>
            @endforeach
        </div>
    </div>
</div>
@endsection
`
  );

  root.file(
    'resources/views/pos/index.blade.php',
    `@extends('layouts.app')
@section('content')
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-8 space-y-4">
        <h2 class="text-2xl font-black italic uppercase">Mostrador de Calaminas &amp; Corte</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @foreach($products as $p)
            <div class="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                <div>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100">{{ $p->sku }}</span>
                    <h3 class="font-bold text-sm mt-2">{{ $p->name }}</h3>
                    <p class="text-xs text-slate-500 mt-1">Ancho útil {{ $p->useful_width_m }}m · {{ $p->profile_type }}</p>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <span class="font-black text-base">Bs {{ number_format($p->base_price_per_meter, 2) }}/{{ $p->unit_label }}</span>
                    <button onclick="addProduct({{ $p->id }}, '{{ $p->name }}', {{ $p->base_price_per_meter }})" class="px-3 py-1.5 rounded-xl bg-[#c2410c] text-white text-xs font-bold uppercase">+ Agregar</button>
                </div>
            </div>
            @endforeach
        </div>
    </div>
    <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
        <h3 class="font-black italic uppercase">Pedido Actual</h3>
        <div id="cart-list" class="text-xs text-slate-500">Selecciona productos del catálogo.</div>
        <div class="pt-3 border-t flex justify-between font-black text-lg">
            <span>Total:</span>
            <span id="cart-total" class="text-[#c2410c]">Bs 0.00</span>
        </div>
    </div>
</div>
<script>
const cart = [];
function addProduct(id, name, price) {
    cart.push({ product_id: id, name, color_code: 'RAL-3009', gauge: '28', length_meters: 3.0, quantity: 10, subtotal: price * 30 });
    document.getElementById('cart-list').innerHTML = cart.map(i => '<div class="py-1 border-b">' + i.quantity + 'x ' + i.name + ' (3.0m) - Bs ' + i.subtotal.toFixed(2) + '</div>').join('');
    document.getElementById('cart-total').textContent = 'Bs ' + cart.reduce((a,b)=>a+b.subtotal, 0).toFixed(2);
}
</script>
@endsection
`
  );

  root.file(
    'resources/views/inventory/index.blade.php',
    `@extends('layouts.app')
@section('content')
<div class="space-y-6">
    <h2 class="text-2xl font-black italic uppercase">Almacén de Calaminas y Bobinas Madre</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @foreach($coils as $coil)
        <div class="p-4 rounded-2xl bg-white border border-slate-200">
            <div class="font-bold">{{ $coil->coil_code }} · {{ $coil->color_code }} (Cal. {{ $coil->gauge }})</div>
            <div class="text-sm text-[#c2410c] font-black mt-1">{{ $coil->remaining_meters }} / {{ $coil->initial_meters }} ml</div>
            <div class="text-xs text-slate-400 mt-1">{{ $coil->supplier }} · Lote {{ $coil->lot_number }}</div>
        </div>
        @endforeach
    </div>
</div>
@endsection
`
  );

  root.file(
    'resources/views/cut-orders/index.blade.php',
    `@extends('layouts.app')
@section('content')
<h2 class="text-2xl font-black italic uppercase mb-4">Órdenes de Corte en Roladora ({{ $cutOrders->count() }})</h2>
<div class="space-y-3">
    @foreach($cutOrders as $order)
    <div class="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
        <div>
            <div class="font-bold">{{ $order->order_number }} · {{ $order->client_name }}</div>
            <div class="text-xs text-slate-500">{{ $order->machine }} · {{ $order->total_meters }} ml</div>
        </div>
        <span class="px-3 py-1 rounded-lg bg-orange-50 text-[#c2410c] text-xs font-bold uppercase">{{ $order->status }}</span>
    </div>
    @endforeach
</div>
@endsection
`
  );

  root.file(
    'resources/views/sales/index.blade.php',
    `@extends('layouts.app')
@section('content')
<h2 class="text-2xl font-black italic uppercase mb-4">Historial de Ventas y Despachos</h2>
<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <table class="w-full text-xs text-left">
        <thead class="bg-slate-50 border-b">
            <tr><th class="p-3">Factura</th><th class="p-3">Cliente</th><th class="p-3">Despacho</th><th class="p-3 text-right">Total</th></tr>
        </thead>
        <tbody>
            @foreach($sales as $s)
            <tr class="border-b"><td class="p-3 font-bold">{{ $s->invoice_number }}</td><td class="p-3">{{ $s->client->name }}</td><td class="p-3">{{ $s->dispatch_status }}</td><td class="p-3 text-right font-bold">Bs {{ number_format($s->total, 2) }}</td></tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
`
  );

  root.file(
    'resources/views/audit/index.blade.php',
    `@extends('layouts.app')
@section('content')
<h2 class="text-2xl font-black italic uppercase mb-4">Seguridad y Auditoría del Sistema</h2>
<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <table class="w-full text-xs text-left">
        <thead class="bg-slate-50 border-b">
            <tr><th class="p-3">Fecha</th><th class="p-3">Módulo</th><th class="p-3">Acción</th><th class="p-3">Detalle</th><th class="p-3">Operador</th></tr>
        </thead>
        <tbody>
            @foreach($logs as $log)
            <tr class="border-b"><td class="p-3">{{ $log->created_at }}</td><td class="p-3 font-bold">{{ $log->module }}</td><td class="p-3">{{ $log->action }}</td><td class="p-3">{{ $log->detail }}</td><td class="p-3">{{ $log->actor_name }}</td></tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
`
  );

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
