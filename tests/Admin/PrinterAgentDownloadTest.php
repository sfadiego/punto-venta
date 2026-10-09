<?php

namespace Tests\Admin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use App\Services\PrinterAgentPackageService;
use Tests\TestCase;
use ZipArchive;

class PrinterAgentDownloadTest extends TestCase
{
    private const URL = '/api/printer-agent/download';

    private function payload(array $overrides = []): array
    {
        return array_merge(['printer' => 'POS58', 'port' => 8765, 'platform' => 'win'], $overrides);
    }

    // Sustituye el armado del ZIP: el binario real no existe en el storage de pruebas (ni debe pisarse el local).
    private function fakePackage(): void
    {
        $this->mock(PrinterAgentPackageService::class, function ($mock) {
            $mock->shouldReceive('buildZip')->andReturnUsing(function (string $platform, array $config) {
                $path = sys_get_temp_dir().'/print-agent-test-'.uniqid().'.zip';
                $zip = new ZipArchive;
                $zip->open($path, ZipArchive::CREATE);
                $zip->addFromString('config.json', json_encode($config));
                $zip->close();

                return $path;
            });
        });
    }

    public function test_admin_descarga_el_agente_con_su_configuracion(): void
    {
        $this->fakePackage();

        $response = $this->post(self::URL, $this->payload(['printer' => 'EPSON_TM-T20', 'port' => 9000]), $this->authHeaders());

        $response->assertStatus(200)->assertDownload('print-agent-win.zip');
    }

    public function test_empleado_no_puede_descargar_el_agente(): void
    {
        $this->fakePackage();
        $empleado = User::factory()->create([
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $this->postJson(self::URL, $this->payload(), $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_descarga_sin_autenticacion(): void
    {
        $this->postJson(self::URL, $this->payload())->assertStatus(401);
    }

    public function test_exige_el_nombre_de_la_impresora_y_una_plataforma_valida(): void
    {
        $this->postJson(self::URL, $this->payload(['printer' => '']), $this->authHeaders())->assertStatus(400);
        $this->postJson(self::URL, $this->payload(['platform' => 'linux']), $this->authHeaders())->assertStatus(400);
    }

    public function test_binario_no_disponible_responde_404_con_mensaje(): void
    {
        $this->mock(PrinterAgentPackageService::class, fn ($mock) => $mock->shouldReceive('buildZip')->andReturn(null));

        $this->postJson(self::URL, $this->payload(), $this->authHeaders())
            ->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }
}
