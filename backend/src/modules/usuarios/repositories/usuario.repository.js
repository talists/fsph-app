// src/modules/usuarios/repositories/usuario.repository.js

import AppDataSource from "../../../config/data-source.js";
// CORREÇÃO 3: Caminho do model ajustado
import { Usuario } from "../usuario.model.js"; 
// CORREÇÃO 2: Adicionado 'Brackets' ao import
import { In, Not, IsNull, Brackets } from "typeorm";

const repo = AppDataSource.getRepository(Usuario);

export class UsuarioRepository {
    
    static async findAll() { 
        return await repo.find(); 
    }

    static async findById(id) { 
        return await repo.findOneBy({ id }); 
    }

    static async findByEmail(email) { 
        return await repo.findOneBy({ email }); 
    }

    static async findByGoogleId(id_google) { 
        return await repo.findOneBy({ id_google }); 
    }

    static async create(data) { 
        return await repo.save(repo.create(data)); 
    }

    static async update(id, data) { 
        await repo.update(id, data); 
        return await repo.findOneBy({ id }); 
    }
    
    static async delete(id) { 
        return await repo.delete(id); 
    }

    static async findByTiposSanguineosComFcmToken(tiposSanguineos) {
        return await repo.find({
            where: {
                tipo_sanguineo: In(tiposSanguineos),
                fcm_token: Not(IsNull()),
            }
        });
    }

    static async findAllComFcmToken() {
        return await repo.find({
            where: { fcm_token: Not(IsNull()) }
        });
    }
    
    static async findInaptosParaReativacao() {
        // CORREÇÃO 1: Criando uma nova data para cada cálculo para evitar mutação
        const dataLimiteHomens = new Date();
        dataLimiteHomens.setDate(dataLimiteHomens.getDate() - 60);

        const dataLimiteMulheres = new Date();
        dataLimiteMulheres.setDate(dataLimiteMulheres.getDate() - 90);

        return await repo.createQueryBuilder("usuario")
            .where("usuario.esta_apto_para_doar = :apto", { apto: false })
            .andWhere(new Brackets(qb => {
                qb.where("usuario.sexo = :sexoM AND usuario.data_ultima_doacao <= :dataM", {
                    sexoM: 'M',
                    dataM: dataLimiteHomens.toISOString().split('T')[0]
                })
                .orWhere("usuario.sexo = :sexoF AND usuario.data_ultima_doacao <= :dataF", {
                    sexoF: 'F',
                    dataF: dataLimiteMulheres.toISOString().split('T')[0]
                });
            }))
            .getMany();
    }
}