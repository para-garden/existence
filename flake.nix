{
  description = "existence — a text-based HTML5 game";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "existence";
          buildInputs = with pkgs; [ bun ];
          shellHook = ''
            echo "existence — bun serve.js → localhost:3000"
          '';
        };

        apps.default = {
          type = "app";
          program = "${pkgs.writeShellScript "existence-serve" ''
            exec ${pkgs.bun}/bin/bun ${self}/serve.js
          ''}";
        };

        checks.default = pkgs.runCommandNoCC "existence-tests" {
          buildInputs = [ pkgs.bun ];
        } ''
          cp -r ${self} ./src
          chmod -R u+w ./src
          cd ./src
          bun test
          touch $out
        '';
      }
    );
}
